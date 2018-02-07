'use strict'

// load locales
const locales = ['zh', 'en-US'];
let messages = {};
locales.forEach(v => {
	messages[v] = require(`./${v}`).default;
});

// create i18n
function L(lang, key) {
	let msgs = messages[lang]
	if(!msgs) {
		if(lang && lang.indexOf('-') != -1) {
			msgs = messages[lang.split('-')[0]]
		}
		if(!msgs) {
			msgs = messages['en-US']
		}
	}
	return msgs[key] ? msgs[key] : key
}

export default L;