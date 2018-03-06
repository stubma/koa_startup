'use strict'

var LRU = require("lru-cache")
import ecc from '../ecc'

// a cache of cursors
let queryCache = LRU({
	max: 30,
	maxAge: 10 * 60 * 1000
})

/**
 * a query wrapper which will cache same query for later pagination
 */
class QueryCache {
	static get(model, selector = null, sort = null) {
		// build a string for query, and make a hash for cache key
		let buf = model.modelName
		if(selector) {
			buf += JSON.stringify(selector)
		} else {
			buf += 'null'
		}
		if(sort) {
			buf += JSON.stringify(sort)
		} else {
			buf += 'null'
		}
		let key = ecc.sha256(buf, 'base64')
		let ckey = key + ':count'

		// get query, if not found, create cursor and count cursor for it
		let cursor = queryCache.get(key)
		if(cursor == undefined) {
			cursor = model.find(selector ? selector : {})
			if(sort) {
				cursor.sort(sort)
			}
			queryCache.set(key, cursor)

			// set count cursor
			queryCache.set(ckey, cursor.toConstructor()())
		}

		// get count cursor
		let countCursor = queryCache.get(ckey)
		if(countCursor == undefined) {
			countCursor = model.find(selector ? selector : {})
			queryCache.set(ckey, countCursor)
		}

		// return both
		return [cursor, countCursor]
	}
}

export default QueryCache