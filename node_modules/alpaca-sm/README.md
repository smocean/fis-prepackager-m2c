# alpaca-sm

针对sm公司业务定制的用于模块化解析的工具。

因公司前端业务框架的原因，前端开发不能使用市面上的模块化类库，如seajs,requireJs,modJs等。

此工具是在编译阶段，将采用commonJS规范的模块化代码，转译成闭包形式的代码。

## USAGE

模块化的代码

a.js
```js
module.exports = function(){
	alert('a.js');
}

```
