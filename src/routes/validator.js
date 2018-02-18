'use strict'

import _ from 'lodash'
import { ErrCode } from '../models'

/*
 key is url, value is schema should in following format
 {
 	paramName: {
 		isValid: function to validate parameter,
 		optional: true/false
 	},
 	... more
 }
 */
let paramSchemas = {}

/**
 * register a schema for a url
 * @param url url
 * @param schema request parameter schema
 */
function registerParamSchema(url, schema) {
	paramSchemas[url] = schema
}

/**
 * validate request parameters
 */
function validateRequestParams() {
	return async function(ctx, next) {
		// request body should be json
		if(!_.isPlainObject(ctx.request.body)) {
			ErrCode.build(ctx, ErrCode.ERR_REQUEST_NOT_JSON)
		} else {
			// get schema, if no schema, just forward
			let schema = paramSchemas[_.trimEnd(ctx.url, '/')]
			if(schema) {
				// validate, break when one parameter is wrong
				let valid = true
				for(let key in schema) {
					let param = ctx.request.body[key]
					let validator = schema[key]
					if(!param && !validator.optional) {
						valid = false
						ErrCode.build(ctx, ErrCode.ERR_PARAM_MISSING, key)
						break
					} else if(param && !validator.isValid(param)) {
						valid = false
						ErrCode.build(ctx, ErrCode.ERR_PARAM_NOT_VALID, key)
						break
					}
				}

				// if valid, forward
				if(valid) {
					await next()
				}
			} else {
				await next()
			}
		}
	}
}

/**
 * validator which ensures value is a positive number
 */
function positiveNumberValidator(value) {
	return _.isNumber(value) && value > 0
}

/**
 * validator which ensures value is a non-empty string
 */
function nonEmptyStringValidator(value) {
	return _.isString(value) && value.length > 0
}

export default {
	registerParamSchema,
	validateRequestParams,
	positiveNumberValidator,
	nonEmptyStringValidator
}