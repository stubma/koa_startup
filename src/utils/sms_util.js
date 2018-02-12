'use strict'

import serverConfig from '../config/server_config'
import leancloud from './leancloud_provider'
import twilio from './twilio_provider'
import L from '../i18n'

/**
 * request a sms code for a mobile
 * @param mobile mobile number string
 * @param lang language code
 * @return null if ok, error message if failed
 */
async function requestSmsCode(mobile, lang) {
	if(serverConfig.sms_provider == 'leancloud') {
		return await leancloud.requestSmsCode(mobile, lang)
	} else if(serverConfig.sms_provider == 'twilio') {
		return await twilio.requestSmsCode(mobile, lang)
	} else {
		return L(lang, 'sms_provider_not_supported')
	}
}

/**
 * verify a sms code
 * @param mobile mobile number string
 * @param sms sms code
 * @param lang language code
 * @return null if ok, error message if failed
 */
async function verifySmsCode(mobile, sms, lang) {
	if(serverConfig.sms_provider == 'leancloud') {
		return await leancloud.verifySmsCode(mobile, sms, lang)
	} else if(serverConfig.sms_provider == 'twilio') {
		return await twilio.verifySmsCode(mobile, sms, lang)
	} else {
		return L(lang, 'sms_provider_not_supported')
	}
}

/**
 * generate sms code by yourself
 * @param length sms code length
 * @return {string} sms code string
 */
function generateSmsCode(length) {
	let code = ''
	while(length-- > 0) {
		code += String.fromCharCode(0x30 + Math.floor(Math.random() * 10))
	}
	return code
}

export default {
	requestSmsCode,
	verifySmsCode,
	generateSmsCode
}