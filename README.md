fis-prepackager-m2c
==============================

##安装与使用

1.全局安装

```bash
npm install fis-prepackager -g
```

2.开启和配置插件

在fis-conf.js中使用如下代码：

```javascript
fis.config.merge('modules.prepackager','m2c');
fis.config.merge('settings.prepackager.m2c',{
	options: {
		ns: 'sm',
		readcss: true,
		exclude: ['**/vue.js']
	},
	tmpl: {
		js: '<script type="text/javascript" src="{0}"></script>',
		css: '<link rel="stylesheet" type="text/css" href="{0}">'
	}
});
```
## settings说明
options:常用的一些设置主要有：

	1、ns:命名空间，模块化代码转成闭包后使用的命名空间，默认'alp'。

	2、readcss:主要针对出现在js中的require('./xx.css')处理方式,默认true。true：读取css文件的内容并写入到js中；false:不读取css文件的内容,而是分析依赖。
	
	3、exclude:排除一些已存在的使用require关键字的文件，比如用webpack或browerify打包的文件。
	
	4、readcssInHtml:出现在html中的script标签中的css是否可读,同readcss

## 在项目中使用

1.按nodejs的开发方式写js

f.js内容
```javascript
var t = '马云'
module.exports.obj = {
		a:t
}
```

a-object.js内容
```javascript
var f = require('./f.js');
module.exports = {
	sayName: function(name) {
		console.log(name);
		console.log(f.obj.a);
	}
}
```

在script标签中加data-main作为标识

```html
<!DOCTYPE html>
<html>
<head>
	<title></title>
</head>
<body>
	<script type="text/javascript" data-main>
		var a = require('./a-object.js');
		a.sayName('您好');
	</script>
</body>
</html>
```


2.执行fis release -d output

文件结果
```html
<!DOCTYPE html>
<html>
<head>
	<title></title>
	</head>
	<body>
	<script type="text/javascript" src="f.js"></script>
	<script type="text/javascript" src="a-object.js"></script>
	<script type = "text/javascript">
	window.sm = window.sm || {};
	(function (sm, a_object_js) {
		 var a = a_object_js;
	     a.sayName('你好');
	 }(sm, sm.a_object_js));
</script>
</body>
</html>
```
f.js
```javascript
window.sm = window.sm || {};
(function (sm) {
	var t = '马云'
	sm.obj = { a: t };
 }(sm));
```

a-object.js
```javascript
window.sm = window.sm || {};
(function (sm) {
	var f = sm;
	sm.a_object_js = {
		sayName: function (name) {
			console.log(name);
			console.log(f.obj.a);
		}
	};
}(sm));
```

	






