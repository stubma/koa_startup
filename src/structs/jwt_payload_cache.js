'use strict'

let LRU = require("lru-cache")

// a cache of user sign in payload, there is timestamp in payload
// so we can check it when verification jwt token, and only allow
// last sign in
let payloadCache = LRU({
	max: 1000000,
	maxAge: 2 * 24 * 60 * 60 * 1000
})

class JwtPayloadCache {
	/**
	 * get user payload
	 */
	static get(userId) {
		return payloadCache.get(userId)
	}

	static set(userId, payload) {
		payloadCache.set(userId, payload)
	}
}

export default JwtPayloadCache
