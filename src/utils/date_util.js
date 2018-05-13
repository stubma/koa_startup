'use strict'

class DateUtil {
	/**
	 * convert yyyy-MM-dd string to date
	 */
	static ymd2Date(str) {
		let parts = str.split('-')
		let year = parseInt(parts[0])
		let month = parseInt(parts[1])
		let day = parseInt(parts[2])
		month = month < 10 ? `0${month}` : `${month}`
		day = day < 10 ? `0${day}` : `${day}`
		return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
	}
	/**
	 * convert a time to yyyy-MM-dd format string
	 */
	static time2ymd(time) {
		return DateUtil.date2ymd(new Date(time))
	}

	/**
	 * convert a date to yyyy-MM-dd format string
	 */
	static date2ymd(date) {
		let y = date.getFullYear()
		let m = date.getUTCMonth() + 1
		let d = date.getUTCDate()
		m = m < 10 ? `0${m}` : `${m}`
		d = d < 10 ? `0${d}` : `${d}`
		return `${y}-${m}-${d}`
	}
}

export default DateUtil