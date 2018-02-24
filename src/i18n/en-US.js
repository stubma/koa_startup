const en_US = {
	// error messages
	err_ok: 'OK',
	err_internal_server_error: "Internal server error",
	err_user_exists: 'User already exists',
	err_user_not_exist: "User does not exist",
	err_password_wrong: 'Password incorrect',
	err_no_jwt_token: 'Missing authorization info',
	err_invalid_jwt_token: 'Invalid authorization info',
	err_invalid_ws_request: 'To use websocket, you should pass a json message which contains _url, _method and _headers',
	err_request_not_json: 'Request should be a json object',
	err_param_missing: 'parameter "%s" is missing',
	err_param_not_valid: 'parameter "%s" is not valid',
	err_request_sms_failed: 'Failed to request sms code: %s',
	err_verify_sms_failed: 'Failed to verify sms code: %s',

	// app name
	app_name: 'Koa Startup',

	// common
	unknown_error: 'Unknown Error',
	sms_provider_not_supported: 'Sms service provider not supported',

	// twilio
	twilio_tpl_register: 'Welcome to Koa Startup, your register code: %s'
};
export default en_US;