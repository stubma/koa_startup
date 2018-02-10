'use strict'

import ecc from '../ecc'
import {ExtractJwt} from 'passport-jwt'
import jwt from 'jsonwebtoken'
import ErrCode from '../models/err_msg'
import jwtConfig from '../config/jwt_config'
import serverConfig from '../config/server_config'
import _ from 'lodash'

let secret = null
let jwtFreeUrls = {}

/**
 * register a url so it won't be verified for jwt token
 * @param url url need to be ignored for jwt
 */
function registerJwtFreeUrl(url) {
	jwtFreeUrls[url] = true
}

/**
 * check login token
 */
function checkToken() {
	// generate auth secret
	ecc.PrivateKey.randomKey().then(function(key) {
		secret = key.toString('hex')
	})

	return async function(ctx, next) {
		// if enabled jwt and url is not jwt-free, verify jwt toke
		if(serverConfig.enable_jwt) {
			if(!jwtFreeUrls[_.trimEnd(ctx.url, '/')]) {
				// get token
				let token = ExtractJwt.fromAuthHeaderAsBearerToken()(ctx.request)
				if(token == null) {
					ErrCode.build(ctx, ErrCode.ERR_NO_JWT_TOKEN)
				} else {
					// verify jwt token
					// if failed, return error
					// if ok, forward request
					await jwt.verify(token, secret, jwtConfig, async (error, payload) => {
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
	getSecret,
	registerJwtFreeUrl
}