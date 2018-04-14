'use strict'

import log4js from 'log4js'
import logConfig from '../config/log_config'
import fs from 'fs'

// load config
log4js.configure(logConfig);

// get logger
const logger = log4js.getLogger()
const errLogger = log4js.getLogger('error')

class LogUtil {
	// create logs path
	static _confirmPath(pathStr) {
		if(!fs.existsSync(pathStr)) {
			fs.mkdirSync(pathStr)
		}
	}

	/**
	 * init log util
	 */
	static init() {
		if(logConfig.baseLogPath) {
			this._confirmPath(logConfig.baseLogPath)
			for(var i = 0, len = logConfig.appenders.length; i < len; i++) {
				if(logConfig.appenders[i].path) {
					this._confirmPath(logConfig.baseLogPath + logConfig.appenders[i].path)
				}
			}
		}
	}

	static formatResp(ctx, resTime) {
		let logText = new String()

		// start sep
		logText += "\n" + "*************** response log start ***************" + "\n"

		// format
		logText += this.formatReq(ctx.request, resTime)

		// log status code
		logText += "response status: " + ctx.status + "\n"

		// log response
		logText += "response body: " + "\n" + JSON.stringify(ctx.body) + "\n"

		// end sep
		logText += "*************** response log end ***************" + "\n"

		return logText
	}

	static formatError(ctx, err, resTime) {
		let logText = new String()

		// start sep
		logText += "\n" + "*************** error log start ***************" + "\n"

		// format
		logText += this.formatReq(ctx.request, resTime)

		// log error name
		logText += "err name: " + err.name + "\n"

		// log message
		logText += "err message: " + err.message + "\n"

		// log stack
		logText += "err stack: " + err.stack + "\n"

		// end sep
		logText += "*************** error log end ***************" + "\n"

		return logText
	}

	static formatReq(req, resTime) {
		let logText = new String()

		// log method
		let method = req.method
		logText += "request method: " + method + "\n"

		// log original url
		logText += "request originalUrl:  " + req.originalUrl + "\n"

		// log ip
		logText += "request client ip:  " + req.ip + "\n"

		// log request
		if(method === 'GET') {
			logText += "request query:  " + JSON.stringify(req.query) + "\n"
		} else {
			logText += "request body: " + "\n" + JSON.stringify(req.body) + "\n"
		}

		// log time
		logText += "response time: " + resTime + "\n"

		return logText
	}

	static logError(ctx, error, resTime) {
		if(ctx && error) {
			errLogger.error(this.formatError(ctx, error, resTime))
		}
	}

	static logResponse(ctx, resTime) {
		if(ctx) {
			logger.info(this.formatResp(ctx, resTime));
		}
	}
}

export default LogUtil