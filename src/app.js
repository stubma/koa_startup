#!/usr/bin/env node

'use strict'

import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import auth from './routes/auth'
import users from './routes/users'
import validator from './routes/validator'
import LogUtil from './utils/log_util'
import enforceHttps from 'koa-sslify'
import http from 'http'
import https from 'https'
import fs from 'fs'
import logConfig from './config/log_config'
import KoaWebSocketServer from './ws/koa_ws'
import serverConfig from './config/server_config'

// create koa
const Koa = require('koa')
const app = new Koa()

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
	var port = parseInt(val, 10)

	if(isNaN(port)) {
		// named pipe
		return val
	}

	if(port >= 0) {
		// port number
		return port
	}

	return false
}

// create logs path
function confirmPath(pathStr) {
	if(!fs.existsSync(pathStr)) {
		fs.mkdirSync(pathStr)
	}
}
function initLogPath() {
	if(logConfig.baseLogPath) {
		confirmPath(logConfig.baseLogPath)
		for(var i = 0, len = logConfig.appenders.length; i < len; i++) {
			if(logConfig.appenders[i].path) {
				confirmPath(logConfig.baseLogPath + logConfig.appenders[i].path)
			}
		}
	}
}
initLogPath()

// error handler
onerror(app, {
	accepts: function() {
		return 'json'
	},
	json: function(err) {
		this.body = {
			err_code: err.status,
			err_msg: http.STATUS_CODES[err.status]
		}
	}
})

// Force HTTPS on all page
// app.use(enforceHttps())

// middlewares
app.use(bodyparser({
	enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())

// logger
app.use(async (ctx, next) => {
	// handle request and record time consumed
	const start = Date.now()
	await next()
	const ms = Date.now() - start

	// log response
	LogUtil.logResponse(ctx, ms);

	// output time
	console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// to enable CORS
if(!serverConfig.enable_cors) {
	app.use(async (ctx, next) => {
		ctx.set('Access-Control-Allow-Origin', '*')
		ctx.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With')
		ctx.set('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
		ctx.set('X-Powered-By', ' 3.2.1')
		if(ctx.method == 'OPTIONS') {
			ctx.response.status = 200
		} else {
			await next()
		}
	})
}

// routes
app.use(auth.checkToken())
app.use(validator.validateRequestParams())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
	// log error
	LogUtil.logError(ctx, err)
});

// SSL options
// var options = {
// 	key: fs.readFileSync('./ssl/server.key'),
// 	cert: fs.readFileSync('./ssl/server.pem')
// };

// Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000')

// create http and websocket server
// you can disable websocket server in server_config.json
let server = null
if(serverConfig.enable_websocket) {
	server = new KoaWebSocketServer(app)
	server.use(auth.checkToken())
	server.use(validator.validateRequestParams())
	server.use(users.routes())
} else {
	server = http.createServer(app.callback())
}

// Listen on provided port, on all network interfaces.
server.listen(port)
