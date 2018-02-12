'use strict'

import { User, ErrCode } from '../models'
const fetch = require('node-fetch')
const assert = require('assert')

describe('User API', () => {
	// jwt token
	let token = null

	// clear users table
	before(async () => {
		await User.remove({})
	})

	it('request parameter validate', async () => {
		// register, missing parameter
		await fetch('http://localhost:3000/users/register_pwd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mobile: "13344556677",
				password: "my-password"
			})
		}).then(async resp => {
			// response should be ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				assert.equal(j.err_code, ErrCode.ERR_PARAM_MISSING[0])
			})
		})

		// register, invalid parameter
		await fetch('http://localhost:3000/users/register_pwd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mobile: 4455,
				nation_code: "+86",
				lang: "zh-CN",
				password: "my-password"
			})
		}).then(async resp => {
			// response should be ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				// it should return user name, same as mobile
				assert.equal(j.err_code, ErrCode.ERR_PARAM_NOT_VALID[0])
			})
		})
	})

	it('register by password', async () => {
		// register
		await fetch('http://localhost:3000/users/register_pwd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mobile: "13344556677",
				nation_code: "+86",
				lang: "zh-CN",
				password: "my-password"
			})
		}).then(async resp => {
			// response should be ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				// it should return user name, same as mobile
				assert.equal(j.name, '13344556677')
			})
		})

		// register same user again, should fail
		await fetch('http://localhost:3000/users/register_pwd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mobile: "13344556677",
				nation_code: "+86",
				lang: "zh-CN",
				password: "my-password"
			})
		}).then(async resp => {
			// response still ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				// it should return user name, same as mobile
				assert.equal(j.err_code, ErrCode.ERR_USER_EXISTS[0])
			})
		})
	})

	it('login by password', async () => {
		// login
		await fetch('http://localhost:3000/users/login_pwd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				mobile: "13344556677",
				nation_code: "+86",
				lang: "zh-CN",
				password: "my-password"
			})
		}).then(async resp => {
			// response ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				// it should return token
				assert.notEqual(j.token, null)
				token = j.token
			})
		})
	})

	it('login by jwt token', async () => {
		// login with valid token
		await fetch('http://localhost:3000/users/login_jwt', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				mobile: "13344556677",
				nation_code: "+86",
				lang: "zh-CN"
			})
		}).then(async resp => {
			// response ok
			assert.equal(resp.ok, true)

			await resp.json().then(j => {
				// it should return a new token
				assert.notEqual(j.token, null)
				assert.notEqual(j.token, token)
				token = j.token
			})
		})
	})
})