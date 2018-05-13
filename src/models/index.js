'use strict'

import mongoose from 'mongoose'
import UserSchema from './user'
import SmsCodeSchema from './sms_code'
import serverConfig from '../config/server_config'
import ErrCode from './err_msg'

// connect
let config = serverConfig.db[process.env.NODE_ENV] || serverConfig.db['default']
mongoose.connect(config.db_user.length > 0 ?
	`mongodb://${config.db_user}:${config.db_pwd}@${config.db_ip}:${config.db_port}/${config.db_name}` :
	`mongodb://${config.db_ip}:${config.db_port}/${config.db_name}`)

module.exports = {
	ErrCode: ErrCode,
	User: mongoose.model('User', UserSchema),
	SmsCode: mongoose.model('SmsCode', SmsCodeSchema)
}