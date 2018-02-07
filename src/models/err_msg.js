'use strict'

import L from '../i18n'
import _ from 'lodash'

// error code
const codes = {
	ERR_OK: [0, 'OK'],
	ERR_INTERNAL_SERVER_ERROR: [1, 'err_internal_server_error'],
	ERR_USER_EXISTS: [2, 'err_user_exists'],
	ERR_USER_NOT_EXIST: [3, 'err_user_not_exist'],
	ERR_PASSWORD_WRONG: [4, 'err_password_wrong'],
	ERR_NO_JWT_TOKEN: [5, 'err_no_jwt_token'],
	ERR_INVALID_JWT_TOKEN: [6, 'err_invalid_jwt_token'],
	ERR_INVALID_WS_REQUEST: [7, 'err_invalid_ws_request']
}

// class ErrCode
class ErrCode {
	static build(ctx, code) {
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
			err_msg : L(lang, code[1])
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