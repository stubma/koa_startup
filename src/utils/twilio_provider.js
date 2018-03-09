'use strict'

const fetch = require('node-fetch')
import serverConfig from '../config/server_config'
import L from '../i18n'
import smsUtil from './sms_util'
import util from 'util'
import { SmsCode } from '../models'

// require the Twilio module and create a REST client
const client = require('twilio')(serverConfig.twilio_account_sid, serverConfig.twilio_auth_token);

/**
 * request a sms code for a mobile
 * @param nationCode nation code
 * @param mobile mobile number string
 * @param lang language code
 * @param extra for some provider they may need extra parameters
 * @return null if ok, error message if failed
 */
async function requestSmsCode(nationCode, mobile, lang, extra) {
	// generate message, template string must have a %s in it
	let code = smsUtil.generateSmsCode(serverConfig.twilio_code_length)
	let msg = util.format(L(lang, 'twilio_tpl_register'), code)
	let fullMobile = `${nationCode}${mobile}`

	// send message, if success, save sms code in db for later verification
	let errMsg = await client.messages.create({
		to: fullMobile,
		from: serverConfig.twilio_sender,
		body: msg
	}).then(async message => {
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