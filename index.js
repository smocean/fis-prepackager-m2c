var Cache = require('./lib/cache.js');

var alp = require('alpaca-sm');

var pth = require('path');


function regExpFunc(word) {
	return function(depName) {
		return new RegExp('<!--\\s*\\b' + word + '\\b\\s*\\(\\s*[\'\"]{1}([^\'\"]*)(?=' + depName + ')' + depName + '\\s*[\'\"]{1}\\s*\\)\\s*-->', 'gi');
	}
}



module.exports = function(ret, conf, settings, opt) {
	var alp_conf = {},
		cache = new Cache(!!opt.optimize),
		result = {},
		jsTmpl = settings.tmpl.js,
		cssTmpl = settings.tmpl.css,
		getRegExp = regExpFunc(settings.options.word || 'require');

	settings.options['optimizer'] = !!opt.optimize;

	alp_conf = fis.util.merge(alp_conf, settings.options)

	alp.config.merge(alp_conf);

	if (opt.clean) {
		cache.clean();
	}

	fis.util.map(ret.src, function(id, file) {
		var _cache, htmlDepsObj, htmlAdeps, hAdeps = [],
			hDeps, hObj, regExp, hCache;

		id = id.replace(/^[\/]*/, '');
		_cache = cache.read(id);
		if (!fis.util.isEmpty(_cache)) {
			file.setContent(_cache.content);

			file.ext !== '.html' && file.ext !== '.htm' && (ret.map.res[id].adeps = _cache.map.adeps);

		} else {
			if (file.ext !== '.html' && file.ext !== '.htm') {
				fis.util.merge(result, parseNonHtml(file.fullname));
			} else {
				hDepsObj = alp.txtParse.parse({
					src: file.fullname,
					cnt: function() {
						return file.getContent();
					}
				});
				hDeps = hDepsObj.deps;
				htmlDepsObj = hDepsObj.obj;

				if (!fis.util.isEmpty(htmlDepsObj)) {
					for (var _id in htmlDepsObj) {
						hObj = htmlDepsObj[_id];
						hCache = cache.read(_id);
						if (!fis.util.isEmpty(hCache)) {
							htmlAdeps = hCache.map.adeps;
						} else {
							fis.util.merge(result, parseNonHtml(hObj.absUrl));
							htmlAdeps = result[_id].map.adeps;
						}
						hAdeps = hAdeps.concat(htmlAdeps);
						regExp = getRegExp(hObj.raw);
						file.setContent(modifyHtmlContent(file.getContent(), file.fullname, _id, regExp, htmlAdeps));
					}
				}
				
				cache.write(id, {
					content: file.getContent(),
					map: {
						deps: hDeps,
						adeps: hAdeps,
						base:alp.config.get('base')
					}
				});
			}
		}
	});

	for (var k in result) {
		cache.write(k, result[k]);
		ret.ids[k].setContent(result[k].content);
		ret.map.res[k].adeps = result[k].map.adeps;
	}


	cache.flush();

	function modifyHtmlContent(content, fullname, id,regExp, htmlAdeps) {

		return content.replace(regExp, function() {
			var map = htmlAdeps;
			var str = '';
			for (var i = 0, len = map.length; i < len; i++) {

				str += buildTag(pth.relative(pth.dirname(fullname), map[i]));
			}
			str += buildTag(pth.relative(pth.dirname(fullname), id));
			return str;

		});
	}

	function buildTag(path) {
		var ext = pth.extname(path).replace('.', '').toLocaleLowerCase(),
			reg = /\{\d{1}\}/,
			tmpl;
		if (ext === 'css') {
			tmpl = cssTmpl;
		} else if (ext === 'js') {
			tmpl = jsTmpl;

		}

		return tmpl.replace(reg, path) + '\n';

	}

	/*function get*/

	function parseNonHtml(fullname) {
		return alp.parse({
			src: fullname,
			cnt: function(src, base) {
				var relsrc = pth.relative(base, src);
				var content, retObj;
				retObj = ret.ids[relsrc];
				if (retObj) {
					return retObj.getContent();
				} else {
					return fis.util.read(src).toString();
				}

			}
		});
	}

};