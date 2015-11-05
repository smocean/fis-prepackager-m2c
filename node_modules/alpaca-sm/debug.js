var alp = require('./index.js');
var _ = alp._;
alp.config.merge({
	base: process.cwd(),
	word: 'require',
	optimizer:true,
	readcss:false
});
console.time('');
require('/Users/gml/github/testJS/alp-conf.js');
var result = alp.parse({
	src: '/Users/gml/github/testJS/d.js'
});

for (var i in result) {

	_.write(_.path.resolve(alp.config.get('base'), 'output3', i), result[i].content, 'utf-8');

}

console.timeEnd('');