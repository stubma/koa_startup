'use strict'

import ecc from '../ecc'
import encoder from 'htmlencode'

/**
 * sign a bunch of parameters with a private key
 * @param params parameters
 * @param wifKey private key, or in wif format
 * @return {*|string} hex string of signature
 */
function signParams(params, key) {
	let priv = typeof(key) == 'string' ? ecc.PrivateKey.fromWif(key) : key
	let sortedKeys = Object.keys(params).sort()
	let buf = ''
	for(let i in sortedKeys) {
		let key = sortedKeys[i]
		if(buf.length > 0) {
			buf += '&'
		}
		buf += key
		buf += '='
		buf += encoder.htmlEncode(String(params[key]))
	}
	let hash = ecc.sha256(buf)
	return ecc.sign(hash, priv, false)
}

/**
 * verify signatures by public key
 * @param params parameters
 * @param key public key, or in wif format
 * @param sigatureField signature field name
 * @return true if signature is valid
 */
function verifyParams(params, key, sigatureField = 'sig') {
	if(params[sigatureField]) {
		let pub = typeof(key) == 'string' ? ecc.PublicKey.fromString(key) : key
		let sortedKeys = Object.keys(params).sort()
		let buf = ''
		for(let i in sortedKeys) {
			let key = sortedKeys[i]
			if(key == sigatureField) {
				continue
			}
			if(buf.length > 0) {
				buf += '&'
			}
			buf += key
			buf += '='
			buf += encoder.htmlEncode(String(params[key]))
		}
		let hash = ecc.sha256(buf)
		return ecc.verify(params[sigatureField], hash, pub, false)
	} else {
		return false
	}
}

module.exports = {
	signParams,
	verifyParams
}