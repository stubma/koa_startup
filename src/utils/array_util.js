'use strict'

class ArrayUtil {
	/**
	 * binary search an element, return index. however, element at index may not
	 * equal with given element
	 */
	static binarySearch(arr, ele) {
		let low = 0
		let high = arr.length - 1
		while(low <= high) {
			let mid = Math.floor((low + high) / 2)
			let sym = arr[mid]
			if(sym > ele) {
				high = mid - 1
			} else if(sym < ele) {
				low = mid + 1
			} else {
				return mid
			}
		}
		return low
	}

	/**
	 * binary search an object array, key is the field to be compared
	 */
	static binarySearchObject(arr, ele, key) {
		let low = 0
		let high = arr.length - 1
		while(low <= high) {
			let mid = Math.floor((low + high) / 2)
			let sym = arr[mid][key]
			if(sym > ele[key]) {
				high = mid - 1
			} else if(sym < ele[key]) {
				low = mid + 1
			} else {
				return mid
			}
		}
		return low
	}

	/**
	 * check if an element exists in array
	 */
	static binaryExist(arr, ele) {
		let idx = this.binarySearch(arr, ele)
		if(idx >= 0 && idx < arr.length) {
			return arr[idx] == ele
		}
		return false
	}

	/**
	 * check if an object exists in array, key is field to be compared
	 */
	static binaryExistObject(arr, ele, key) {
		let idx = this.binarySearchObject(arr, ele, key)
		if(idx >= 0 && idx < arr.length) {
			return arr[idx][key] == ele[key]
		}
		return false
	}

	/**
	 * binary insert an element, if element is inserted, return true. otherwise
	 * return false
	 */
	static binaryInsert(arr, ele, allowDuplicated = false) {
		let idx = this.binarySearch(arr, ele)
		if(idx >= 0 && idx < arr.length) {
			if(arr[idx] != ele || allowDuplicated) {
				arr.splice(idx, 0, ele)
				return true
			}
		} else {
			arr.splice(idx, 0, ele)
			return true
		}
		return false
	}

	/**
	 * binary insert an object, key is the field to be compared
	 */
	static binaryInsertObject(arr, ele, key, allowDuplicated = false) {
		let idx = this.binarySearchObject(arr, ele, key)
		if(idx >= 0 && idx < arr.length) {
			if(arr[idx][key] != ele[key] || allowDuplicated) {
				arr.splice(idx, 0, ele)
				return true
			}
		} else {
			arr.splice(idx, 0, ele)
			return true
		}
		return false
	}
}

export default ArrayUtil