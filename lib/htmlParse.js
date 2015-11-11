var alp = require('alpaca-sm');
var scriptRegExp = /<script .*?data-main.*?>([\s\S]*?)<\/script>/mig;
var pth = require('path');

var tmpl = fis.config.get('settings.prepackager.m2c.tmpl');

function getScriptMap(id, file, ret) {
	var result = {},
		content = file.getContent(),
		ns = alp.config.get('ns'),
		nsRegExp = new RegExp('(window\\.' + 'sm' + ')(\\s*)=\\2\\1\\2\\|\\|\\2\\{\\}[;,]?','gm'),
		closureReg = alp.config.get('optimizer') ?
		new RegExp('(window\\.' + ns + ')\\s*=\\s*\\1(\\|\\|\\{\\})[,;]\\s*?function\\s*\\(.*?\\)\\s*?\\{\\}\\s*?\\(' + ns + '\\);', 'gi') :
		new RegExp('(window\\.' + ns + ')(\\s*)=\\2\\1\\2\\|\\|\\2\\{\\};([\\r\\n\\s])*\\(function\\2\\(' + ns + '\\)\\2\\{[\\r\\n\\s]*?\\}\\(' + ns + '\\)\\);*', 'gim');

	if (typeof content === 'string') {
		content = content.replace(scriptRegExp, function() {
			var jsContent = arguments[1],
				_result = {},
				adeps,
				nContent = "",
				_nContent = "";

			_result = alp.jsParse({
				src: file.fullname,
				cnt: function(src, base) {
					var relsrc = pth.relative(base, src);
					var retObj;

					if (relsrc === id) {
						return jsContent;
					}
					retObj = ret.ids[relsrc];
					if (retObj) {
						return retObj.getContent();
					} else {
						return fis.util.read(src).toString();
					}
				}
			});
			adeps = _result[id].map.adeps;
			for (var i = 0, len = adeps.length; i < len; i++) {
				nContent += buildTag(pth.relative(pth.dirname(file.fullname), adeps[i]));
			}
			_nContent = _result[id].content.replace(closureReg, '');
			if (_nContent != '') {
				nContent = nContent.replace(nsRegExp,'');

				nContent += '<script type = "text/javascript">\n' + _nContent + '\n</script>';
			}
			fis.util.merge(result, _result);

			return nContent;
		});
	}

	if (fis.util.isEmpty(result)) {
		result[id] = {
			content: content,
			map: {
				deps: [],
				adeps: [],
				base: alp.config.get('base')
			}
		}
	} else {
		result[id].content = content
	}

	return result;
}

function buildTag(path) {
	var ext = pth.extname(path).replace('.', '').toLocaleLowerCase(),
		reg = /\{\d{1}\}/;

	if(['scss','css','less','sass','styl'].indexOf(ext)>=0){
		
		path = path.replace(new RegExp('\\.\\s*'+ext+'$','gi'),'.css');
		ext = 'css';
	}

	return tmpl[ext].replace(reg, path) + '\n';

}


module.exports = function(id, file, ret, opt) {

	var result = {};

	alp.config.merge(opt);

	result = getScriptMap(id, file, ret);

	return result;
}