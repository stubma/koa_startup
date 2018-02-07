'use strict'

import mongoose from 'mongoose'

let UserSchema = new mongoose.Schema({
	mobile: {
		type: String
	},
	password: {
		type: String
	}
}, {
	collection: 'users',
	versionKey: false
});

export default UserSchema