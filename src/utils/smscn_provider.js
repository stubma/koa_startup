'use strict'

const fetch = require('node-fetch')
import serverConfig from '../config/server_config'
import L from '../i18n'
import smsUtil from './sms_util'
import util from 'util'
import { SmsCode } from '../models'
import encoder from 'htmlencode'
import urlencode from 'urlencode'

/**
 * request a sms code for a mobile
 * @param nationCode nation code
 * @param mobile mobile number string
 * @param lang language code
 * @param extra for some provider they may need extra parameters
 * @return null if ok, error message if failed
 */
async function requestSmsCode(nationCode, mobile, lang, extra) {
	// must have extra and template argument
	if(!extra || !extra.template) {
		return L(lang, 'sms_template_not_set')
	}

	// get template id
	let domestic = nationCode == '+86'
	let tplId = domestic ? serverConfig.sms_cn_templates.zh[extra.template] : serverConfig.sms_cn_templates.en[extra.template]
	if(!tplId) {
		return L(lang, 'sms_template_invalid')
	}

	// generate message
	let code = smsUtil.generateSmsCode(serverConfig.sms_cn_code_length)

	// full mobile
	let fullMobile = `${nationCode}${mobile}`

	// generate content
	let contentJson = {}
	contentJson[serverConfig.sms_cn_code_param_name] = code
	contentJson[serverConfig.sms_cn_app_param_name] = L(lang, 'app_name')
	let content = urlencode(JSON.stringify(contentJson))

	// request, sms.cn use different url for domestic and international sms
	// and you can't add nation code for domestic sms
	let domesticUrl = 'http://api.sms.cn/sms/?ac=send'
	let internationalUrl = 'http://api.sms.cn/sms/?ac=sendint'
	let url = domestic ? domesticUrl : internationalUrl
	let number = domestic ? mobile : fullMobile
	let errMsg = await fetch(`${url}&uid=${serverConfig.sms_cn_uid}` +
		`&pwd=${serverConfig.sms_cn_api_pwd}&template=${tplId}&mobile=${number}&content=${content}`)
		.then(async resp => {
			if(resp.ok && resp.status < 300) {
				await resp.json().then(async j => {
					if(j.error) {
						return j.error
					} else {
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

						// null means no error
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