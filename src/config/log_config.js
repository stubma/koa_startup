'use strict'

import path from 'path'

// root path of log
const baseLogPath = path.resolve(__dirname, '../../logs')

// error log sub path, name and full path
const errorPath = "/error"
const errorFileName = "error"
const errorLogPath = baseLogPath + errorPath + "/" + errorFileName

// response log sub path, name and full path
const responsePath = "/response"
const responseFileName = "response"
const responseLogPath = baseLogPath + responsePath + "/" + responseFileName

export default {
	appenders: {
		responseLogs: {
			category: "respLogger",
			type: "dateFile",
			filename: responseLogPath,
			alwaysIncludePattern: true,
			pattern: "-yyyy-MM-dd-hh.log",
			path: responsePath
		},
		errorLogs: {
			category: "errorLogger",
			type: "dateFile",
			filename: errorLogPath,
			alwaysIncludePattern: true,
			pattern: "-yyyy-MM-dd-hh.log",
			path: errorPath
		},
		stderr: {
			category: 'stderr',
			type: 'stdout',
			layout: {
				type: 'basic'
			}
		}
	},
	categories: {
		default: { appenders: ['responseLogs'], level: 'info' },
		error: { appenders: ['errorLogs', 'stderr'], level: 'error' }
	},
	baseLogPath: baseLogPath
}
