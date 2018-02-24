'use strict'

import http from 'http'
const debug = require('debug')('koa:websocketserver')
const co = require('co')
import compose from 'koa-compose'
import { ErrCode } from '../models'

class KoaWebSocketServer {
	constructor(app) {
		// Create HTTP server
		this.app = app
		this.middleware = []
		this.server = http.createServer(app.callback())

		// websocket server
		let io = require('engine.io')(this.server)

		// handle websocket connection
		io.on('connection', ws => {
			// create route chain
			const fn = co.wrap(compose(this.middleware))

			// handle client message
			ws.on('message', message => {
				// parse message to json object
				let j = null
				try {
					j = JSON.parse(message)
				} catch(e) {
				}

				// we required _method, _url and _headers
				// if no such fields, neglect this message
				if(!j._url || !j._headers || !j._method) {
					ws.send(JSON.stringify(ErrCode.build(null, ErrCode.ERR_INVALID_WS_REQUEST)))
					return
				}

				// create context
				let res = {
					headers: {
						'Content-Type': 'application/json'
					},
					setHeader: (field, val) => {
						res.headers[field] = val
					},
					removeHeader: field => {
						delete res.headers[field]
					},
					flushHeaders: () => {
					}
				}
				const ctx = this.app.createContext({
					url: j._url,
					method: j._method,
					socket: ws.request.connection,
					headers: j._headers
				}, res)
				let url = j._url
				let method = j._method
				delete j._url
				delete j._method
				delete j._headers
				ctx.request.body = j

				// dispatch
				fn(ctx).then(function() {
					// when chain is done, we send reply back, but we need
					// add _url for client reference
					ctx.response.body._url = url
					ctx.response.body._method = method
					ws.send(JSON.stringify(ctx.response.body))
				}).catch(function(err) {
					debug(err)

					// send a default error reply, and add url for client reference
					let reply = ErrCode.build(null, ErrCode.ERR_INTERNAL_SERVER_ERROR)
					reply._url = url
					reply._method = method
					ws.send(JSON.stringify(reply))
				})
			})
		})

		// setup event
		this.server.on('error', this.onError.bind(this))
		this.server.on('listening', this.onListening.bind(this))
	}

	listen(port) {
		this.server.listen(port)
	}

	use(fn) {
		this.middleware.push(fn);
		return this;
	}

	/**
	 * Event listener for HTTP server "error" event.
	 */
	onError(error) {
		if(error.syscall !== 'listen') {
			throw error
		}

		var bind = typeof port === 'string'
			? 'Pipe ' + port
			: 'Port ' + port

		// handle specific listen errors with friendly messages
		switch(error.code) {
			case 'EACCES':
				console.error(bind + ' requires elevated privileges')
				process.exit(1)
				break;
			case 'EADDRINUSE':
				console.error(bind + ' is already in use');
				process.exit(1)
				break;
			default:
				throw error
		}
	}

	/**
	 * Event listener for HTTP server "listening" event.
	 */
	onListening() {
		let addr = this.server.address()
		let bind = typeof addr === 'string'
			? 'pipe ' + addr
			: 'port ' + addr.port
		debug('Listening on ' + bind)
	}
}

export default KoaWebSocketServer