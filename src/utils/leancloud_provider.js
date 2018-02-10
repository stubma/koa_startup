'use strict'

const fetch = require('node-fetch')
import serverConfig from '../config/server_config'
import L from '../i18n'

/**
 * request a sms code for a mobile
 * @param mobile mobile number string
 * @param lang language code
 * @return null if ok, error message if failed
 */
async function requestSmsCode(mobile, lang) {
	let errMsg = await fetch('https://gwh6r3kd.api.lncld.net/1.1/requestSmsCode', {
		method: 'POST',
		headers: {
			'X-LC-Id': serverConfig.leancloud_id,
			'X-LC-Key': serverConfig.leancloud_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			mobilePhoneNumber: mobile,
			app_name: L(lang, 'app_name'),
			template: lang.startsWith('zh') ? serverConfig.leancloud_templates.zh : serverConfig.leancloud_templates.en
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

async function verifySmsCode(mobile, sms, lang) {
	let errMsg = await fetch(`https://gwh6r3kd.api.lncld.net/1.1/verifySmsCode/${sms}`, {
		method: 'POST',
		headers: {
			'X-LC-Id': serverConfig.leancloud_id,
			'X-LC-Key': serverConfig.leancloud_key,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			mobilePhoneNumber: mobile
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