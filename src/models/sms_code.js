'use strict'

import mongoose from 'mongoose'

/**
 * some sms provider doesn't have verification api, so we must save sms code and verify
 * it by ourselves. The mobile is full mobile number, i.e., include nation code, such as
 * +8612233445566
 */
let SmsCodeSchema = new mongoose.Schema({
	mobile: {
		type: String,
		unique: true
	},
	code: {
		type: String
	}
}, {
	collection: 'sms_code',
	versionKey: false
})

export default SmsCodeSchema