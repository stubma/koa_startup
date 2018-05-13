'use strict'

import mongoose from 'mongoose'
import { ObjectID } from 'mongodb'

let UserSchema = new mongoose.Schema({
	name: {
		type: String
	},
	nationCode: {
		type: String
	},
	mobile: {
		type: String
	},
	password: {
		type: String
	}
}, {
	collection: 'user',
	versionKey: false
})

/**
 * get user by object id or object id string
 */
UserSchema.statics.getById = async function(userId) {
	if(typeof(userId) == 'string') {
		return await this.findOne({ _id: ObjectID(userId) })
	} else {
		return await this.findOne({ _id: userId })
	}
}

export default UserSchema