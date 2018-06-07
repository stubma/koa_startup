'use strict'

import validator from '../routes/validator'
import ErrCode from '../models/err_msg'
import ecc from '../ecc'

// singleton
let instance = null

/**
 * an event subscriber only for web socket connection. client can request some events from server
 * and server will push corresponded event to client. the package url will be '/event' and will
 * carry a string data field whose format depends on event. also, it may have a completed boolean
 * field indicating there is no more event
 *
 * endpoint of subscriber is /admin/subscribe_event and /admin/unsubscribe_event
 */
class WSSubscriber {
	static get instance() {
		if(!instance) {
			instance = new WSSubscriber()
		}
		return instance
	}

	constructor() {
		// key is cid, value is event name map
		// in event name map, key is event name, value is websocket object
		this.subscriptionMap = {}
	}

	pushEvent(event, data, completed = false) {
		// build data hash
		let dataStr = typeof(data) == 'string' ? data : JSON.stringify(data)
		let hash = ecc.sha256(dataStr)

		// check registered client
		for(let cid in this.subscriptionMap) {
			let sub = this.subscriptionMap[cid]
			if(sub[event]) {
				let ws = sub[event]
				if(ws.connected) {
					// if websocket is connected, check last push hash
					let hashKey = `__${event}_hash`
					let lastHash = ws[hashKey]
					if(hash != lastHash) {
						ws.send(JSON.stringify({
							_url: '/event',
							_method: 'POST',
							data: data,
							event: event,
							completed: completed
						}))
						ws[hashKey] = hash
					}
				} else {
					// if websocket is disconnected, remove it from subscription map
					delete sub[event]
				}
			}
		}
	}

	install(server) {
		// create router
		const prefix = '/admin'
		const router = require('koa-router')({
			prefix: prefix
		})

		// register schema
		validator.registerParamSchema(`${prefix}/subscribe_event`, {
			cid: {
				isValid:  validator.nonEmptyStringValidator
			},
			event : {
				isValid : validator.nonEmptyStringValidator
			},
			lang: {
				isValid: validator.nonEmptyStringValidator,
				optional: true
			}
		})
		validator.registerParamSchema(`${prefix}/unsubscribe_event`, {
			cid: {
				isValid:  validator.nonEmptyStringValidator
			},
			event : {
				isValid : validator.nonEmptyStringValidator
			},
			lang: {
				isValid: validator.nonEmptyStringValidator,
				optional: true
			}
		})

		// register endpoint
		router.post('/subscribe_event', this.on_subscribe_event.bind(this))
		router.post('/unsubscribe_event', this.on_unsubscribe_event.bind(this))

		// add router
		server.use(router.routes())
	}

	async on_subscribe_event(ctx, next) {
		// get params
		let { cid, event } = ctx.request.body

		// add
		if(this.subscriptionMap[cid] == null) {
			this.subscriptionMap[cid] = {}
		}
		this.subscriptionMap[cid][event] = ctx.req.ws

		// ok
		ErrCode.build(ctx, ErrCode.ERR_OK)
		Object.assign(ctx.response.body, {
			event: event
		})
	}

	async on_unsubscribe_event(ctx, next) {
		// get params
		let { cid, event } = ctx.request.body

		// add
		if(this.subscriptionMap[cid] != null) {
			delete this.subscriptionMap[cid][event]
		}

		// ok
		ErrCode.build(ctx, ErrCode.ERR_OK)
		Object.assign(ctx.response.body, {
			event: event
		})
	}
}

export default WSSubscriber