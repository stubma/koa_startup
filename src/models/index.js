'use strict'

import mongoose from 'mongoose'
import UserSchema from './user'
import SmsCodeSchema from './sms_code'
import serverConfig from '../config/server_config'
import ErrCode from './err_msg'

// connect
mongoose.connect(process.env.NODE_ENV === 'production' ? `mongodb://yourserverip:27017/${serverConfig.db_name}` : `mongodb://localhost:27017/${serverConfig.db_name}`)

module.exports = {
	ErrCode: ErrCode,
	User: mongoose.model('User', UserSchema),
	SmsCode: mongoose.model('SmsCode', SmsCodeSchema)
}