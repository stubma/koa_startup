'use strict';

var ws = require('socket.io-client')('wss://localhost:3000')

ws.on('connect', function open() {
	console.log("open")
	ws.send(JSON.stringify({
		_method: 'POST',
		_url: '/user/login_pwd',
		_headers: {
			'content-type' : 'application/json'
		},
		mobile: "13344556677",
		nationCode: "+86",
		lang: "zh-CN",
		password: "111111"
	}))
});

ws.on('message', d => {
	let data = JSON.parse(d);
	console.log("receive data: " + d)
});

ws.on('disconnect', function close() {
	console.log('disconnected');
});

ws.on('error', function err(e) {
	console.log('error: ' + e);
});