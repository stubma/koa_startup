'use strict'

import ecc from '../ecc'
import { ExtractJwt } from 'passport-jwt'
import jwt from 'jsonwebtoken'
import { ErrCode } from '../models'
import serverConfig from '../config/server_config'
import _ from 'lodash'
import JwtPayloadCache from '../structs/jwt_payload_cache'

let secret = null
let jwtFreeUrls = {}
let jwtFreePrefixes = {}
let urlPermissions = {} // key is url, value is permission name
let prefixPermissions = {} // key is prefix, value is permission name

/**
 * register a url so it won't be verified for jwt token
 * @param url url need to be ignored for jwt
 */
function registerJwtFreeUrl(url) {
	jwtFreeUrls[url] = true
}

/**
 * register a prefix so all url starts with that prefix will not be
 * validated against jwt
 */
function registerJwtFreePrefix(prefix) {
	jwtFreePrefixes[prefix] = true
}

/**
 * register a url permission so a user which has such permission can access it
 */
function registerUrlPermission(url, perm) {
	urlPermissions[url] = perm
}

/**
 * register permission for a prefix so any url starts with this prefix require such permission
 */
function registerPrefixPermission(prefix, perm) {
	prefixPermissions[prefix] = perm
}

function isJwtFree(ctx) {
	// trim trailing slash
	let url = _.trimEnd(ctx.url, '/')

	// if url is registered, true
	if(jwtFreeUrls[url]) {
		return true
	}

	// if url starts with any registered prefix, true
	for(let prefix in jwtFreePrefixes) {
		if(url.startsWith(prefix)) {
			return true
		}
	}

	// fallback
	return false
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
		// if jwt is not enabled, skip
		if(!serverConfig.jwt.enable) {
			return next()
		}

		// if url is jwt free, skip
		if(isJwtFree(ctx)) {
			return next()
		}

		// now jwt is required, check token
		let token = ExtractJwt.fromAuthHeaderAsBearerToken()(ctx.request)
		if(token == null) {
			ErrCode.build(ctx, ErrCode.ERR_NO_JWT_TOKEN)
			return
		}

		// verify jwt token
		await jwt.verify(token, secret, serverConfig.jwt.options, async (error, payload) => {
			// if has error, failed
			if(error) {
				ErrCode.build(ctx, ErrCode.ERR_INVALID_JWT_TOKEN)
				return
			}

			// check payload, if timestamp is not same, then user must sign in from other device
			let cachedPayload = JwtPayloadCache.get(payload.userId)
			if(cachedPayload.timestamp != payload.timestamp) {
				ErrCode.build(ctx, ErrCode.ERR_INVALID_JWT_TOKEN)
				return
			}

			// if url has permission requirement, check permission in payload
			let url = _.trimEnd(ctx.url, '/')
			let requiredPermission = urlPermissions[url]
			if(requiredPermission && requiredPermission != payload.permission) {
				ErrCode.build(ctx, ErrCode.ERR_PERMISSION_NOT_GRANTED)
				return
			}

			// if prefix has permission requirement, check permission
			for(let prefix in prefixPermissions) {
				if(url.startsWith(prefix)) {
					requiredPermission = prefixPermissions[prefix]
					if(requiredPermission != payload.permission) {
						ErrCode.build(ctx, ErrCode.ERR_PERMISSION_NOT_GRANTED)
						return
					}
					break
				}
			}

			// passed
			return next()
		})
	}
}

function getSecret() {
	return secret
}

export default {
	checkToken,
	getSecret,
	registerJwtFreeUrl,
	registerJwtFreePrefix,
	registerUrlPermission,
	registerPrefixPermission
}