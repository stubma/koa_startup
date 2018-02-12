'use strict'

import mongoose from 'mongoose'

let UserSchema = new mongoose.Schema({
	name: {
		type: String
	},
	nation_code: {
		type: String
	},
	mobile: {
		type: String
	},
	password: {
		type: String
	}
}, {
	collection: 'users',
	versionKey: false
})

export default UserSchema