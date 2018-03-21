'use strict'

let startTime = 0
let tagTime = 0

class ProfileUtil {
	static start() {
		startTime = Date.now()
		tagTime = startTime
	}

	static tag(text) {
		let end = Date.now()
		console.log(`${text}: time elapsed: ${end - tagTime}`)
		tagTime = end
	}

	static end() {
		this.tag('end')
		let t = Date.now()
		console.log(`end: total time: ${t - startTime}`)
	}
}

export default ProfileUtil
