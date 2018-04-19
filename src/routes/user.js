import ecc from '../ecc'
import jwt from 'jsonwebtoken'
import auth from './auth'
import validator from './validator'
import { User, ErrCode } from '../models'
import smsUtil from '../utils/sms_util'
import serverConfig from '../config/server_config'

// create router
const prefix = '/user'
const router = require('koa-router')({
	prefix: prefix
})

// url need to be ignored for jwt token verification
const jwtFreeUrls = [
	`${prefix}/register_pwd`,
	`${prefix}/register_sms`,
	`${prefix}/login_pwd`,
	`${prefix}/login_sms`,
	`${prefix}/request_sms`
]
jwtFreeUrls.map(url => {
	auth.registerJwtFreeUrl(url)
})

// common parameters
const commonParams = {
	mobile: {
		isValid: validator.nonEmptyStringValidator
	},
	nationCode: {
		isValid: validator.nonEmptyStringValidator
	},
	lang: {
		isValid: validator.nonEmptyStringValidator,
		optional: true
	}
}

// register request schemas
validator.registerParamSchema(`${prefix}/register_pwd`, Object.assign({}, commonParams, {
	password: {
		isValid: validator.nonEmptyStringValidator
	}
}))
validator.registerParamSchema(`${prefix}/register_sms`, Object.assign({}, commonParams, {
	sms: {
		isValid: validator.nonEmptyStringValidator
	}
}))
validator.registerParamSchema(`${prefix}/login_pwd`, Object.assign({}, commonParams, {
	password: {
		isValid: validator.nonEmptyStringValidator
	}
}))
validator.registerParamSchema(`${prefix}/login_sms`, Object.assign({}, commonParams, {
	sms: {
		isValid: validator.nonEmptyStringValidator
	}
}))
validator.registerParamSchema(`${prefix}/login_jwt`, commonParams)
validator.registerParamSchema(`${prefix}/request_sms`, commonParams)

/*
 register a user by mobile and password
 */
router.post('/register_pwd', async (ctx, next) => {
	let { mobile, nationCode, password } = ctx.request.body
	let user = await User.findOne({
		mobile: mobile,
		nationCode: nationCode
	})
	if(user) {
		ErrCode.build(ctx, ErrCode.ERR_USER_EXISTS)
	} else {
		// create new user
		user = new User({
			name: mobile,
			nationCode: nationCode,
			mobile: mobile,
			password: ecc.sha256(password, 'base64')
		})
		await user.save()

		// return
		ErrCode.build(ctx, ErrCode.ERR_OK)
		ctx.response.body.name = user.name
	}
})

/*
 register a user by mobile and sms verify code
 */
router.post('/register_sms', async (ctx, next) => {
	let { mobile, nationCode, sms } = ctx.request.body
	let user = await User.findOne({
		mobile: mobile,
		nationCode: nationCode
	})
	if(user) {
		ErrCode.build(ctx, ErrCode.ERR_USER_EXISTS)
	} else {
		// verify sms, if return null, means ok
		let errMsg = await smsUtil.verifySmsCode(nationCode, mobile, sms)
		if(errMsg) {
			ErrCode.build(ctx, ErrCode.ERR_VERIFY_SMS_FAILED, errMsg)
		} else {
			// create new user
			user = new User({
				name: mobile,
				nationCode: nationCode,
				mobile: mobile
			})
			await user.save()

			// return
			ErrCode.build(ctx, ErrCode.ERR_OK)
			ctx.response.body.name = user.name
		}
	}
})

/*
 login by username and password, we put a password in payload because
 jsonwebtoken uses seconds and it will be the same when requests come fast
 */
router.post('/login_pwd', async (ctx, next) => {
	let { mobile, nationCode, password } = ctx.request.body
	let user = await User.findOne({
		mobile: mobile,
		nationCode: nationCode
	})
	if(user) {
		let pwd = ecc.sha256(password, 'base64')
		if(pwd == user.password) {
			ErrCode.build(ctx, ErrCode.ERR_OK)
			ctx.response.body.token = jwt.sign({
				mobile: mobile,
				nationCode: nationCode,
				timestamp: Date.now()
			}, auth.getSecret(), serverConfig.jwt.options)
		} else {
			ErrCode.build(ctx, ErrCode.ERR_PASSWORD_WRONG)
		}
	} else {
		ErrCode.build(ctx, ErrCode.ERR_USER_NOT_EXIST)
	}
})

/*
 login by sms, if user doesn't exist, will create a new user
 */
router.post('/login_sms', async (ctx, next) => {
	let { mobile, nationCode, sms } = ctx.request.body

	// verify sms, if return null, means ok
	let errMsg = await smsUtil.verifySmsCode(nationCode, mobile, sms)
	if(errMsg) {
		ErrCode.build(ctx, ErrCode.ERR_VERIFY_SMS_FAILED, errMsg)
	} else {
		// create new user if no user here
		let user = await User.findOne({
			mobile: mobile,
			nationCode: nationCode
		})
		if(!user) {
			user = new User({
				name: mobile,
				nationCode: nationCode,
				mobile: mobile
			})
			await user.save()
		}

		// return token
		ErrCode.build(ctx, ErrCode.ERR_OK)
		ctx.response.body.name = user.name
		ctx.response.body.token = await jwt.sign({
			mobile: mobile,
			nationCode: nationCode,
			timestamp: Date.now()
		}, auth.getSecret(), serverConfig.jwt.options)
	}
})

/*
 login by jwt token
 client may cache a jwt token for later use. If cached token is valid, we
 will renew token for user. When code goes here it must be valid because auth
 will verify token before
 */
router.post('/login_jwt', async (ctx, next) => {
	let { mobile, nationCode } = ctx.request.body
	let user = await User.findOne({
		mobile: mobile,
		nationCode: nationCode
	})
	if(user) {
		ErrCode.build(ctx, ErrCode.ERR_OK)
		ctx.response.body.token = await jwt.sign({
			mobile: mobile,
			nationCode: nationCode,
			timestamp: Date.now()
		}, auth.getSecret(), serverConfig.jwt.options)
	} else {
		ErrCode.build(ctx, ErrCode.ERR_USER_NOT_EXIST)
	}
})

/*
 request sms verify code
 */
router.post('/request_sms', async (ctx, next) => {
	// get language
	let { mobile, nationCode } = ctx.request.body
	let lang = ctx.request.body.lang || 'en'

	// request
	let errMsg = await smsUtil.requestSmsCode(nationCode, mobile, lang)
	if(errMsg) {
		ErrCode.build(ctx, ErrCode.ERR_REQUEST_SMS_FAILED, errMsg)
	} else {
		ErrCode.build(ctx, ErrCode.ERR_OK)
	}
})

router.post('/test', async (ctx, next) => {
	ErrCode.build(ctx, ErrCode.ERR_OK)
})

export default router