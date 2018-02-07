## 这是什么
基于Koa的HTTP和WebSocket服务器, 为了减少重复劳动开发的基本后台框架, 可以作为项目startup

1. 实现了JWT认证
2. WebSocket支持使用koa-router进行路由

## WebSocket

WebSocket可以重用HTTP的路由设置, 前提是:

1. 客户端需要发送一个JSON对象的字符串形式
2. JSON对象中必须要有
	* _url: 路径, 例如`/users/register`
	* _method: 方法, 例如`POST`
	* _headers: 头部, 例如`{ "content-type": "application/json" }`, 要小写. `content-type`必须设置为json, 其它随意加

## 例子

可以看test.js