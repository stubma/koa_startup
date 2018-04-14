#!/usr/bin/env node

'use strict'

import json from 'koa-json'
import onerror from 'koa-onerror'
import bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import serve from 'koa-static'
import auth from './routes/auth'
import user from './routes/user'
import validator from './routes/validator'
import LogUtil from './utils/log_util'
import enforceHttps from 'koa-sslify'
import http from 'http'
import https from 'https'
import KoaWebSocketServer from './ws/koa_ws'
import serverConfig from './config/server_config'
import greenlock from 'greenlock-express'
import fs from 'fs'
import path from 'path'

// create koa
const Koa = require('koa')
const app = new Koa()

// init log
LogUtil.init()

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
if(serverConfig.https.enable && !serverConfig.https.use_le) {
	app.use(enforceHttps())
}

// middlewares
app.use(bodyparser({
	enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(serve('static'))

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

// avatar should be free of jwt auth
auth.registerJwtFreePrefix('/avatar/')

// routes
app.use(auth.checkToken())
app.use(validator.validateRequestParams())
app.use(user.routes(), user.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
	// log error
	LogUtil.logError(ctx, err)
})

// create server, based on https config, we create secure server or normal server
let server = null
if(serverConfig.https.enable) {
	// if we use letsencrypt, install letsencrypt middleware
	// if not, use static server key & certificate
	if(serverConfig.https.use_le) {
		// create challenger
		let leHttpChallenge = require('le-challenge-fs').create({
			webrootPath: '~/letsencrypt/var/',
			debug: true
		})
		let leSniChallenge = require('le-challenge-sni').create({
			debug: true
		})
		leSniChallenge.loopback = 'XXXX' // to avoid error, workaround loopback checking
		leSniChallenge.test = 'XXXXX' // to avoid error, workaround test checking

		// create LE handler
		let le = greenlock.create({
			server: 'staging', // in production use 'https://acme-v01.api.letsencrypt.org/directory'
			configDir: '~/letsencrypt/etc',
			approveDomains: function (opts, certs, cb) {
				console.log(`+++++++++ opts is ${JSON.stringify(opts)}, certs is ${JSON.stringify(certs)} +++++++++++`)
				opts.domains = certs && certs.altnames || opts.domains;
				opts.email = 'stubma@163.com'
				opts.agreeTos = true;
				cb(null, { options: opts, certs: certs });
			},
			challenges: {
				'http-01': leHttpChallenge,
				'tls-sni-01': leSniChallenge,
				'tls-sni-02': leSniChallenge
			},
			challengeType: 'http-01',
			debug: true
		})

		// create https server
		server = https.createServer(le.httpsOptions, le.middleware(app.callback()))
	} else {
		// SSL options, resolve key/cert file path
		let absolutePath = serverConfig.https.server_key_file.startsWith('/')
		let keyPath = absolutePath ?
			serverConfig.https.server_key_file :
			path.resolve(__dirname, serverConfig.https.server_key_file)
		absolutePath = serverConfig.https.server_cert_file.startsWith('/')
		let certPath = absolutePath ?
			serverConfig.https.server_cert_file :
			path.resolve(__dirname, serverConfig.https.server_cert_file)
		absolutePath = serverConfig.https.server_ca_file.startsWith('/')
		let caPath = absolutePath ?
			serverConfig.https.server_ca_file :
			path.resolve(__dirname, serverConfig.https.server_ca_file)
		var options = {
			key: fs.readFileSync(keyPath),
			cert: fs.readFileSync(certPath),
			ca: fs.readFileSync(caPath)
		}

		// create https server
		server = https.createServer(options, app.callback())
	}
} else {
	server = http.createServer(app.callback())
}

// if websocket is enabled, wrap http server with a websocket server
if(serverConfig.enable_websocket) {
	server = new KoaWebSocketServer(app, server)
	server.use(auth.checkToken())
	server.use(validator.validateRequestParams())
	server.use(user.routes())
}

// start listen, if https, use 443. if not, use custom port
if(serverConfig.https.enable) {
	if(serverConfig.https.use_le) {
		server.listen(443)
	} else {
		server.listen(Number(serverConfig.https.server_port || '443'))
	}
} else {
	// Get port from environment
	let port = Number(process.env.PORT || '3000')

	// listen on custom port
	server.listen(port)
}
