'use strict'

import mongoose from 'mongoose'

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

export default UserSchema