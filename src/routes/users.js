import ecc from '../ecc'
import jwt from 'jsonwebtoken'
import auth from './auth'
import { User } from '../models/db'
import ErrCode from '../models/err_msg'
import jwtConfig from '../config/jwt_config'
const router = require('koa-router')({
	prefix: '/users'
})

router.post('/register', async (ctx, next) => {
	let mobile = ctx.request.body.mobile
	let password = ctx.request.body.password
	let user = await User.findOne({mobile: mobile})
	if(user) {
		ErrCode.build(ctx, ErrCode.ERR_USER_EXISTS)
	} else {
		// create new user
		user = new User({
			mobile: mobile,
			password: ecc.sha256(password, 'base64')
		})
		await user.save()

		// return
		ctx.response.type = 'application/json'
		ctx.response.body = { mobile: mobile }
	}
})

router.post('/login', async (ctx, next) => {
	let mobile = ctx.request.body.mobile
	let password = ctx.request.body.password
	let user = await User.findOne({mobile: mobile})
	if(user) {
		let pwd = ecc.sha256(password, 'base64')
		if(pwd == user.password) {
			ctx.response.type = 'application/json'
			ctx.response.body = {
				result: 'ok',
				token: jwt.sign({
					mobile: mobile,
					password: pwd
				}, auth.getSecret(), jwtConfig)
			}
		} else {
			ErrCode.build(ctx, ErrCode.ERR_PASSWORD_WRONG)
		}
	} else {
		ErrCode.build(ctx, ErrCode.ERR_USER_NOT_EXIST)
	}
})

router.post('/test', async (ctx, next) => {
	ctx.response.type = 'application/json'
	ctx.response.body = { result: 'access ok!!!' }
})

export default router