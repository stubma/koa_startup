'use strict'

import mongoose from 'mongoose'
import UserSchema from './user'

// connect
mongoose.connect(process.env.NODE_ENV === 'production' ? 'mongodb://yourserverip:27017/test' : 'mongodb://localhost:27017/test')

module.exports = {
	User: mongoose.model('user', UserSchema)
}