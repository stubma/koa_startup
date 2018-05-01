'use strict'

import _ from 'lodash'
import serverConfig from '../config/server_config'
import ErrCode from '../models/err_msg'
const debug = require('debug')('ip-filter')

/*
 key is url, value is ip option, such as
 {
 	whitelist: [ pattern1, pattern2, ... ],
 	blacklist: [ pattern1, pattern2, ... ]
 }
 if an ip is in whitelist and blacklist simultaneously, blacklist will take
 precedence over whitelist
 */
let ipSchemas = {}

/**
 * set url ip options
 */
function registerIpSchema(url, schema) {
	ipSchemas[url] = schema
}

/**
 * set url use default ip schema
 */
function registerDefaultIpSchema(url) {
	registerIpSchema(url, serverConfig.ip_filter.default_schema)
}

/**
 * validate request parameters
 */
function validateIp() {
	return async function(ctx, next) {
		// if ip filter not enabled
		if(!serverConfig.ip_filter.enable) {
			return next()
		}

		// if no schema set, allow
		let schema = ipSchemas[_.trimEnd(ctx.url, '/')]
		if(!schema) {
			return next()
		}

		// check whitelist
		const ip = ctx.ip
		let pass = false
		if (schema.whitelist && _.isArray(schema.whitelist)) {
			pass = schema.whitelist.some((item) => {
				return RegExp(item).test(ip)
			})
		}

		// if passed, check blacklist
		if (pass && schema.blacklist && _.isArray(schema.blacklist)) {
			pass = !schema.blacklist.some((item) => {
				return RegExp(item).test(ip)
			})
		}

		// check pass flag
		if (pass) {
			debug(`${new Date()}: "${ip} -> ✓"`)
			return next()
		} else {
			ErrCode.build(ctx, ErrCode.ERR_ACCESS_NOT_ALLOWED)
		}
	}
}

export default {
	registerIpSchema,
	registerDefaultIpSchema,
	validateIp
}
