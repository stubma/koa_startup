'use strict'

const fetch = require('node-fetch')
import serverConfig from '../config/server_config'
import L from '../i18n'

/**
 * request a sms code for a mobile
 * @param nationCode nation code
 * @param mobile mobile number string
 * @param lang language code
 * @param extra for some provider they may need extra parameters
 * @return null if ok, error message if failed
 */
async function requestSmsCode(nationCode, mobile, lang, extra) {
	// for using leancloud template, you should have 200 rmb balance in your account
	// so we set a flag to control use template or not. If you have enough balance,
	// set flag to true and update your template name in server config
	let body = {
		mobilePhoneNumber: `${nationCode}${mobile}`
	}
	if(serverConfig.leancloud_use_template) {
		body.app_name = L(lang, 'app_name')
		body.template = lang.startsWith('zh') ? serverConfig.leancloud_templates.zh : serverConfig.leancloud_templates.en
	}
	let errMsg = await fetch('https://gwh6r3kd.api.lncld.net/1.1/requestSmsCode', {
		method: 'POST',
		headers: {
			'X-LC-Id': serverConfig.leancloud_id,
			'X-LC-Key': serverConfig.leancloud_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	}).then(async resp => {
		if(resp.ok && resp.status < 300) {
			await resp.json().then(j => {
				if(j.error) {
					return j.error
				} else {
					return null
				}
			})
		} else {
			return resp.statusText
		}
	}).catch(e => {
		return e.toString()
	})
	return errMsg
}

async function verifySmsCode(nationCode, mobile, sms, lang) {
	let errMsg = await fetch(`https://gwh6r3kd.api.lncld.net/1.1/verifySmsCode/${sms}`, {
		method: 'POST',
		headers: {
			'X-LC-Id': serverConfig.leancloud_id,
			'X-LC-Key': serverConfig.leancloud_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			mobilePhoneNumber: `${nationCode}${mobile}`
		})
	}).then(async resp => {
		if(resp.ok && resp.status < 300) {
			await resp.json().then(j => {
				if(j.error) {
					return j.error
				} else {
					return null
				}
			})
		} else {
			return resp.statusText
		}
	}).catch(e => {
		return e.toString()
	})
	return errMsg
}

export default {
	requestSmsCode,
	verifySmsCode
}