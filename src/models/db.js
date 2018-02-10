'use strict'

import mongoose from 'mongoose'
import UserSchema from './user'
import serverConfig from '../config/server_config'

// connect
mongoose.connect(process.env.NODE_ENV === 'production' ? `mongodb://yourserverip:27017/${serverConfig.db_name}` : `mongodb://localhost:27017/${serverConfig.db_name}`)

module.exports = {
	User: mongoose.model('user', UserSchema)
}