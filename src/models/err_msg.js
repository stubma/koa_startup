'use strict'

import L from '../i18n'
import _ from 'lodash'
import util from 'util'

// error code in format [value, string, should format]
const codes = {
	ERR_OK: [0, 'err_ok', false],
	ERR_INTERNAL_SERVER_ERROR: [1, 'err_internal_server_error', false],
	ERR_USER_EXISTS: [2, 'err_user_exists', false],
	ERR_USER_NOT_EXIST: [3, 'err_user_not_exist', false],
	ERR_PASSWORD_WRONG: [4, 'err_password_wrong', false],
	ERR_NO_JWT_TOKEN: [5, 'err_no_jwt_token', false],
	ERR_INVALID_JWT_TOKEN: [6, 'err_invalid_jwt_token', false],
	ERR_INVALID_WS_REQUEST: [7, 'err_invalid_ws_request', false],
	ERR_REQUEST_NOT_JSON: [8, 'err_request_not_json', false],
	ERR_PARAM_MISSING: [9, 'err_param_missing', true],
	ERR_PARAM_NOT_VALID: [10, 'err_param_not_valid', true],
	ERR_REQUEST_SMS_FAILED: [11, 'err_request_sms_failed', true],
	ERR_VERIFY_SMS_FAILED: [12, 'err_verify_sms_failed', true]
}

// class ErrCode
class ErrCode {
	static build(ctx, code, ...args) {
		// get lang
		let lang = 'en-US'
		if(typeof(ctx) === 'string') {
			lang = ctx
		} else if(ctx) {
			lang = ctx.request.body.lang
		}

		// get error json
		let err = {
			err_code : code[0],
			err_msg : code[2] ? util.format(L(lang, code[1]), ...args) : L(lang, code[1])
		}

		// set to context if it is not null
		if(ctx) {
			ctx.response.type = 'application/json'
			ctx.response.body = err
		}

		// return
		return err
	}
}

// put enum to class
_.forEach(codes, (value, key) => {
	Object.defineProperty(ErrCode, key, {
		value: value,
		writable: false
	})
})

export default ErrCode