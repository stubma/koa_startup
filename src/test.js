'use strict';

var ws = require('engine.io-client')('ws://192.168.1.102:3000/');

ws.on('open', function open() {
	console.log("open")
	ws.send(JSON.stringify({
		_method: 'POST',
		_url: '/users/register_pwd',
		_headers: {
			'content-type' : 'application/json',
			'authorization': 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGUiOiIxMzM0NDU1NjY3NyIsInBhc3N3b3JkIjoid1orb0FIZUZVQjU5SDB0Vnd5bWsyZVBHYUFiRnYyckpJUEdFZDJ0cllwQT0iLCJpYXQiOjE1MTc5ODg2MTcsImV4cCI6MTUxODE2MTQxNywiaXNzIjoieHh4Iiwic3ViIjoieHh4In0.Yi_cbpbzV4NiRdq1YsPidt2DnmA2Fj01iyapKerVXlo'
		},
		mobile: "13344556677",
		nationCode: "+86",
		lang: "zh-CN",
		password: "my-passwddord"
	}))
});

ws.on('message', d => {
	let data = JSON.parse(d);
	console.log("receive data: " + d)
});

ws.on('close', function close() {
	console.log('disconnected');
});

ws.on('error', function err(e) {
	console.log('error: ' + e);
});