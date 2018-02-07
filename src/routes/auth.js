'use strict'

import ecc from '../ecc'
import {ExtractJwt} from 'passport-jwt'
import jwt from 'jsonwebtoken'
import ErrCode from '../models/err_msg'
import jwtConfig from '../config/jwt_config'
import serverConfig from '../config/server_config'

let secret = null

function checkToken(ctx, next) {
	// generate auth secret
	ecc.PrivateKey.randomKey().then(function(key) {
		secret = key.toString('hex')
	})

	return async function(ctx, next) {
		// only register and login don't need jwt auth
		if(!ctx.url.startsWith('/users/register') &&
			!ctx.url.startsWith('/users/login')) {
			if(serverConfig.enable_jwt) {
				// get token
				let token = ExtractJwt.fromAuthHeaderAsBearerToken()(ctx.request)
				if(token == null) {
					ErrCode.build(ctx, ErrCode.ERR_NO_JWT_TOKEN)
				} else {
					// verify jwt token
					// if failed, return error
					// if ok, forward request
					jwt.verify(token, secret, jwtConfig, async (error, payload) => {
						if(error) {
							ErrCode.build(ctx, ErrCode.ERR_INVALID_JWT_TOKEN)
						} else {
							await next()
						}
					})
				}
			} else {
				await next()
			}
		} else {
			await next()
		}
	}
}

function getSecret() {
	return secret
}

export default {
	checkToken,
	getSecret
}