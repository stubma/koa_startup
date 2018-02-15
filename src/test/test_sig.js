'use strict'

import sigUtil from '../utils/sig_util'
import ecc from '../ecc'
const assert = require('assert')

describe('Sig Util', () => {
	it('sign & verify', async () => {
		let priv = await ecc.PrivateKey.randomKey()
		let pub = priv.toPublic()
		let params = {
			a: 1,
			b: '222',
			ccc: 0.334,
			DD: '[yes,no]'
		}
		params.sig = sigUtil.signParams(params, priv)
		assert.equal(sigUtil.verifyParams(params, pub), true)
	})
})