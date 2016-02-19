fis-prepackager-m2c
==============================

自动为代码添加闭包代码，在代码编写时就无需手动添加，使得编写前端模块化代码的开发体验与Node.js一致。

该插件不同于FIS内置插件fis-postprocessor-jswrapper，只是简单的添加包装，而是将代码转化成可以直接在浏览器执行的代码。

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
    ns: 'sm',
    exclude: ['**/vue.js'],
    wrapJsInHtml: false,
    tmpl: {
        js: '<script type="text/javascript" src="{0}"></script>',
        css: '<link rel="stylesheet" type="text/css" href="{0}">'
    }
});
```
## settings说明
####ns
    解释：命名空间，模块化代码转成闭包后使用的命名空间
    类型: string
    默认值：'ns'
####exclude
    解释：排除一些已存在的使用require关键字的文件，比如用webpack或browerify打包的文件。
    类型：array | string | RegExp
    默认值：[]
####wrapJsInHtml
    解释：是否对html中的js代码添加闭包代码
    类型：boolean
    默认值：false
    说明：如果代码中的require参与运算的话，就忽略该值，为代码加上闭包。
####tmpl
    解释：css和js的引入模板

## USAGE

###1.按nodejs的开发方式写js

f.js内容
```javascript
module.exports.obj = {
    a:'风清扬'
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


###2.执行fis release -d output

文件结果
```html
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <link rel="stylesheet" type="text/css" href="a/a.css">

</head>

<body>
<script type="text/javascript" src="f.js"></script>
<script type="text/javascript" src="a-object.js"></script>
<script type = "text/javascript">

(function (sm, a_object_js) {

    var a = a_object_js;
    a.sayName('你好');
}(sm, sm.a_object_js));
</script>
</body>
</html>```
f.js
```javascript
window.sm = window.sm || {};
(function (sm) {
    sm.f_js = sm.f_js || {};
    sm.f_js.obj = { a: 'guomilo' };
}(sm));

```

a-object.js
```javascript
window.sm = window.sm || {};
(function (sm, f_js) {
    sm.a_object_js = sm.a_object_js || {};
    var f = f_js;
    sm.a_object_js.sayName = function (name) {
        console.log(name);
        console.log(f.obj.a);
    };
}(sm, sm.f_js));
```
## QA
    Q: 编译时出现 ’Maximum call stack size exceeded’ 或存在循环依赖，在文件[xx]和文件[yy]
    A: 请检测你的文件中是否存在两个文件相互引用的问题

    Q: xx文件命中exclude配置项的规则，将不会对其进行解析，在yy文件中的require('xx')将被替换为undefined
    A: 请检查配置项exclude 或者在 yy文件中修改应用关系。

    Q: xx文件中存在有require方法的不正确使用方式
    A: xx文件中存在requrie(a) 或 require()的用法，这是错误的。正确的：require('a');













