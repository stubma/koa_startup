const zh_CN = {
	// error messages
	err_internal_server_error: '服务器内部错误',
	err_user_exists: '用户已存在',
	err_user_not_exist: "用户不存在",
	err_password_wrong: '密码不正确',
	err_no_jwt_token: '缺少认证信息',
	err_invalid_jwt_token: '无效的认证信息',
	err_invalid_ws_request: '使用WebSocket时, 你需要发送一个JSON对象并包含_url, _method和_headers属性',
	err_request_not_json: '请求参数应该是一个json对象',
	err_param_missing: '缺失参数"%s"',
	err_param_not_valid: '参数"%s"格式错误',
	err_request_sms_failed: '请求验证码失败: %s',
	err_verify_sms_failed: '验证码校验失败: %s',

	// app name
	app_name: 'Koa Startup',

	// common
	unknown_error: '未知错误',
	sms_provider_not_supported: '不支持的短信服务提供商'
};
export default zh_CN;