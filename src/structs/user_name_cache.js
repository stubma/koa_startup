'use strict'

var LRU = require("lru-cache")
import { User } from '../models'

// a cache of user id to name
let nameCache = LRU({
	max: 1000000,
	maxAge: 24 * 60 * 60 * 1000
})

class NameCache {
	/**
	 * get user name by user id
	 */
	static async get(userId) {
		let name = nameCache.get(userId)
		if(name == null) {
			let user = await User.getById(userId)
			if(user) {
				name = user.name
				nameCache.set(userId, name)
			} else {
				console.log(`${userId} is not exist! name cache should not be called!`)
			}
		}
		return name
	}
}

export default NameCache
