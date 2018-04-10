'use strict'

import fs from 'fs'
import path from 'path'
const assert = require('assert')

// tree node wrapping a payload
class AVLNode {
	constructor(payload) {
		this.payload = payload
		this.left = null
		this.right = null
	}
}

/**
 * a reader/writer of avl tree file
 * the avl file uses array presentation:
 * [payload1] [payload2] ... [payloadN], however, to reduce file size, it
 * uses a index mapping file to map real node index to saved index. Just like
 * virtual memory system, we call real node index as 'virtual index' and saved
 * index is 'physical index'
 *
 * it can set a model as tree node payload, the payload model must confirm to
 * following protocol:
 * 1. length property to return byte length of payload
 * 2. read/write method
 * 3. isEmpty method to check payload is empty or not
 * 4. compare method with another payload, return 1 if larger, -1 if smaller, 0 if equal
 * 5. height property
 * 6. virtual index property
 */
class AVLTreeFile {
	constructor(opt) {
		// assert options
		assert(opt.filename, 'You must set filename in option')
		assert(opt.model, 'You must set model in option')

		// helpers
		this._mappingBuf = Buffer.alloc(4)

		// available physical index to write payload to
		this._freePhysicalIndices = []

		// open file
		this.dir = opt.dir || '.'
		this._model = opt.model
		this._writable = opt.writable || false
		this._updatable = opt.updatable || false
		this._filePath = path.resolve(this.dir, opt.filename)
		this._indexFilePath = path.resolve(this.dir, `${opt.filename}.index`)
		this.open()
	}

	get canRead() {
		return this._fd > 0
	}

	get canWrite() {
		return this.canRead && this._writable
	}

	get canUpdate() {
		return this.canRead && this._updatable
	}

	close() {
		if(this._fd > 0) {
			fs.closeSync(this._fd)
			this._fd = 0
			this._size = 0
		}
		if(this._indexFd > 0) {
			fs.closeSync(this._indexFd)
			this._indexFd = 0
		}
	}

	open() {
		// ensure dir is here
		if(!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir)
		}

		// if no file, create an empty file
		// we do this because linux doesn't support positional writing
		if(!fs.existsSync(this._filePath)) {
			fs.closeSync(fs.openSync(this._filePath, 'a+'))
		}
		if(!fs.existsSync(this._indexFilePath)) {
			fs.closeSync(fs.openSync(this._indexFilePath, 'a+'))
		}

		// open file
		let mode = (this._writable || this._updatable) ? 'r+' : 'r'
		this._fd = fs.openSync(this._filePath, mode)
		this._indexFd = fs.openSync(this._indexFilePath, mode)
		this._size = fs.fstatSync(this._fd).size
	}

	_getPhysicalIdx(idx) {
		let size = fs.fstatSync(this._indexFd).size
		let max = Math.floor(size / 4) - 1
		if(idx < 0 || idx > max) {
			return -1
		} else {
			fs.readSync(this._indexFd, this._mappingBuf, 0, 4, idx * 4)
			let physicalIdx = this._mappingBuf.readUInt32LE(0)
			if(physicalIdx == 0) {
				return -1
			} else {
				return physicalIdx - 1
			}
		}
	}

	_mappingIdx(virtualIdx, physicalIdx) {
		// we plus 1 to physical index because zero means invalid index so we
		// will minus 1 when retrieving
		this._mappingBuf.writeUInt32LE(physicalIdx + 1, 0)
		fs.writeSync(this._indexFd, this._mappingBuf, 0, 4, virtualIdx * 4)
	}

	_unmappingIdx(virtualIdx) {
		this._mappingBuf.writeUInt32LE(0, 0)
		fs.writeSync(this._indexFd, this._mappingBuf, 0, 4, virtualIdx * 4)
	}

	_loadPayloadAt(idx) {
		// get physical index
		let physicalIdx = this._getPhysicalIdx(idx)

		// ensure file size is enough
		if(physicalIdx >= 0) {
			let offset = physicalIdx * this._model.length
			let payload = new this._model()
			payload.read(this._fd, offset)
			if(!payload.isEmpty) {
				return payload
			}
		}
		return null
	}

	_find(key) {
		let idx = 0
		let payload = this._loadPayloadAt(idx)
		while(payload) {
			// if smaller, go left child, if larger, go right child
			// if same, break
			let result = payload.compare(key)
			if(result == 1) {
				idx = 2 * idx + 1
			} else if(result == -1) {
				idx = 2 * idx + 2
			} else {
				break
			}

			// load child
			payload = this._loadPayloadAt(idx)
		}
		return payload
	}

	_getFreePhysicalIdx() {
		if(this._freePhysicalIndices.length > 0) {
			return this._freePhysicalIndices.shift()
		} else {
			let max = Math.floor(this._size / this._model.length)
			return max
		}
	}

	_writePayloadAt(payload, idx) {
		// write to physical index
		let physicalIdx = this._getFreePhysicalIdx()
		let offset = physicalIdx * this._model.length
		payload.virtualIdx = idx
		payload.write(this._fd, offset)
		this._size = Math.max(this._size, offset + this._model.length)

		// write mapping
		this._mappingIdx(idx, physicalIdx)
	}

	_wipePayloadAt(idx) {
		let physicalIdx = this._getPhysicalIdx(idx)
		if(physicalIdx >= 0) {
			let offset = physicalIdx * this._model.length
			new this._model().write(this._fd, offset)
			this._unmappingIdx(idx)
			this._freePhysicalIndices.push(physicalIdx)
		}
	}

	_height(idx) {
		let node = this._loadPayloadAt(idx)
		if(!node) {
			return -1
		} else {
			return node.height
		}
	}

	_heightOfNode(node) {
		if(!node || node.payload.isEmpty) {
			return -1
		} else {
			return node.payload.height
		}
	}

	_loadTree(idx, wipe = false) {
		let payload = this._loadPayloadAt(idx)
		if(!payload) {
			return null
		} else {
			let node = new AVLNode(payload)
			if(wipe) {
				this._wipePayloadAt(idx)
			}
			node.left = this._loadTree(2 * idx + 1, wipe)
			node.right = this._loadTree(2 * idx + 2, wipe)
			return node
		}
	}

	_writeTree(node, idx) {
		if(node) {
			this._writePayloadAt(node.payload, idx)
			this._writeTree(node.left, 2 * idx + 1)
			this._writeTree(node.right, 2 * idx + 2)
		}
	}

	_singleRotateLeft(idx) {
		let k2 = this._loadTree(idx, true)
		let k1 = k2.left
		k2.left = k1.right
		k1.right = k2
		this._updateTreeHeight(k1)
		this._writeTree(k1, idx)
	}

	_singleRotateRight(idx) {
		let k2 = this._loadTree(idx, true)
		let k1 = k2.right
		k2.right = k1.left
		k1.left = k2
		this._updateTreeHeight(k1)
		this._writeTree(k1, idx)
	}

	_doubleRotateLeft(idx) {
		this._singleRotateRight(2 * idx + 1)
		this._singleRotateLeft(idx)
	}

	_doubleRotateRight(idx) {
		this._singleRotateLeft(2 * idx + 2)
		this._singleRotateRight(idx)
	}

	_updateTreeHeight(node) {
		if(node) {
			this._updateTreeHeight(node.left)
			this._updateTreeHeight(node.right)
			node.payload.height = Math.max(this._heightOfNode(node.left), this._heightOfNode(node.right)) + 1
		}
	}

	_updateHeight(idx) {
		let payload = this._loadPayloadAt(idx)
		if(payload) {
			payload.height = Math.max(this._height(2 * idx + 1), this._height(2 * idx + 2)) + 1
			let physicalIdx = this._getPhysicalIdx(idx)
			let offset = physicalIdx * this._model.length
			payload.write(this._fd, offset)
		}
	}

	_doInsert(payload, idx) {
		// return true if added ok, or false if already exist
		let added = true

		// load node at index
		let node = this._loadPayloadAt(idx)

		// if empty node, insert it
		// if not, go left or right
		// if same, do nothing
		if(!node) {
			payload.height = 0
			this._writePayloadAt(payload, idx)
		} else if(payload.compare(node) != 0) {
			// left & right
			let leftIdx = 2 * idx + 1
			let rightIdx = 2 * idx + 2

			// insert to left or right, and rotate if not balanced
			let result = payload.compare(node)
			if(result == -1) {
				added = this._doInsert(payload, leftIdx)
				if(this._height(leftIdx) - this._height(rightIdx) == 2) {
					let left = this._loadPayloadAt(leftIdx)
					if(payload.compare(left) == -1) {
						this._singleRotateLeft(idx)
					} else {
						this._doubleRotateLeft(idx)
					}
				}
			} else if(result == 1) {
				added = this._doInsert(payload, rightIdx)
				if(this._height(rightIdx) - this._height(leftIdx) == 2) {
					let right = this._loadPayloadAt(rightIdx)
					if(payload.compare(right) == 1) {
						this._singleRotateRight(idx)
					} else {
						this._doubleRotateRight(idx)
					}
				}
			}

			// update height
			this._updateHeight(idx)
		} else {
			added = false
		}

		// return
		return added
	}

	/**
	 * insert a payload object into avl tree file
	 * @param payload payload object instance
	 * @return {boolean} false if this payload already exists, true if insertion is ok
	 */
	insert(payload) {
		if(this.canWrite) {
			return this._doInsert(payload, 0)
		} else {
			return false
		}
	}

	/**
	 * update payload object
	 * @param payload payload object
	 */
	update(payload) {
		if(this.canUpdate) {
			// check old payload in case there is something changed before update
			let oldPayload = this._loadPayloadAt(payload.virtualIdx)
			if(oldPayload && oldPayload.compare(payload) == 0) {
				let physicalIdx = this._getPhysicalIdx(payload.virtualIdx)
				if(physicalIdx >= 0) {
					let offset = physicalIdx * this._model.length
					payload.height = oldPayload.height
					payload.write(this._fd, offset)
				}
			}
		}
	}

	/**
	 * find payload by key
	 * @param key payload key
	 * @returns payload object or null if not found
	 */
	find(key) {
		if(this.canRead) {
			return this._find(key)
		}
		return null
	}

	/**
	 * remove tail zero part of index file
	 */
	truncate() {
		if(this.canWrite) {
			let size = fs.fstatSync(this._indexFd).size
			for(let i = size - 4; i >= 0; i -= 4) {
				fs.readSync(this._indexFd, this._mappingBuf, 0, 4, i)
				let physicalIdx = this._mappingBuf.readUInt32LE(0)
				if(physicalIdx > 0) {
					fs.ftruncateSync(this._indexFd, i + 4)
					break
				}
			}
		}
	}

	/**
	 * check if a payload can be used
	 * @param key payload key or just a payload object
	 * @returns {boolean} true means this payload can be used
	 */
	available(key) {
		if(this.canRead) {
			let payload = this._find(key)
			if(payload && payload.compare(key) == 0) {
				return !payload.used
			}
		}
		return false
	}

	/**
	 * check if a payload is existent and can be used
	 * @param key payload key or just a payload object
	 * @returns {Array} array contains two booleans, first is existence, second is available
	 */
	existAndAvailable(key) {
		if(this.canRead) {
			let payload = this._find(key)
			if(payload && payload.compare(key) == 0) {
				return [true, !payload.used]
			}
		}
		return [false, false]
	}

	/**
	 * traverse in middle sequence
	 * @param func callback first argument is payload object, it can return
	 * 	a flag indicating abort traverse or not. if it returns true, traverse
	 * 	will end
	 * @param idx start node idx
	 */
	traverse(func, idx = 0) {
		let abort = false
		if(this.canRead) {
			let payload = this._loadPayloadAt(idx)
			if(payload) {
				abort = this.traverse(func, 2 * idx + 1)
				if(!abort) {
					abort = func(payload)
				}
				if(!abort) {
					abort = this.traverse(func, 2 * idx + 2)
				}
			}
		} else {
			abort = true
		}
		return abort
	}
}

export default AVLTreeFile