'use strict'

import serverConfig from '../config/server_config'
import L from '../i18n'
import smsUtil from './sms_util'
import { SmsCode } from '../models'
import util from 'util'
const SMSClient = require('@alicloud/sms-sdk')

async function requestSmsCode(nationCode, mobile, lang, extra) {
	// create client
	let smsClient = new SMSClient({
		accessKeyId: serverConfig.aliyun_access_key_id,
		secretAccessKey: serverConfig.aliyun_access_key_secret
	})

	// generate sms code
	let fullMobile = `${nationCode}${mobile}`
	let code = smsUtil.generateSmsCode(serverConfig.aliyun_code_length)

	// get sign and template
	let domestic = nationCode == '+86'
	nationCode = nationCode.replace(/\+/g, '00')
	let sign = domestic ? serverConfig.aliyun_sign_name.zh : serverConfig.aliyun_sign_name.en
	let template = domestic ? serverConfig.aliyun_template.zh : serverConfig.aliyun_template.en

	// send sms
	let errMsg = await smsClient.sendSMS({
		PhoneNumbers: domestic ? mobile : `${nationCode}${mobile}`,
		SignName: sign,
		TemplateCode: template,
		TemplateParam: `{"code":"${code}"}`
	}).then(async resp => {
		let { Code } = resp
		if(Code === 'OK') {
			// update code record
			let record = await SmsCode.findOne({ mobile: fullMobile })
			if(!record) {
				record = new SmsCode({
					mobile: fullMobile,
					code: code
				})
			} else {
				record.code = code
			}
			await record.save()

			// return null means ok
			return null
		} else {
			return Code
		}
	}, e => {
		return e.toString()
	}).catch(e => {
		return e.toString()
	})
	return errMsg
}

async function verifySmsCode(nationCode, mobile, sms, lang) {
	// manually verify code
	let record = await SmsCode.findOne({ mobile: `${nationCode}${mobile}` })
	if(record) {
		if(record.code == sms) {
			await record.remove()
			return null
		}
	}
	return util.format(L(lang, 'err_verify_sms_failed'), sms)
}

export default {
	requestSmsCode,
	verifySmsCode
}