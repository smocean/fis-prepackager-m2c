var alp = module.exports = {};
if (!global.alp) {
	Object.defineProperty(global, 'alp', {
		enumerable: true,
		writable: false,
		value: alp
	});
}

alp._ = require('./lib/unit.js');

alp.log = require('./lib/log.js');

alp.jsParse = require('./lib/jsParse.js');

alp.txtParse = require('./lib/txtParse.js');

alp.config = require('./lib/config.js');

alp.parse = require('./lib/parse.js');