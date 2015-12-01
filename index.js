var Cache = require('./lib/cache.js');

var alp = require('alpaca-sm');

var pth = require('path');

var hParser = require('./lib/htmlParse.js');

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
		getRegExp = regExpFunc(settings.options.word || 'require'),

		allFiles = {};

	settings.options['optimizer'] = !!opt.optimize;

	alp_conf = fis.util.merge(alp_conf, settings.options)
	alp_conf.useBaseInJsFile = true;
	alp_conf.base = fis.project.getProjectPath();
	alp_conf.readcss = false;
	alp_conf.readcssInHtml = false;
	alp.config.merge(alp_conf);

	fis.util.map(ret.src, function(id, file) {
		var _cache, htmlDepsObj, htmlAdeps, hAdeps = [],
			hDeps, hObj, regExp, hCache, _result = {},
			_id;

		id = id.replace(/^[\/]*/, '');
		_id = pth.normalize(id);
		allFiles[_id] = {
			file: file,
			rawContent: file.getContent()
		};
		_cache = cache.read(id);
		//解决文件内容依赖其它文件的情况比如使用了inline方式
		if (file.cache && !fis.util.isEmpty(file.cache.deps) && !fis.util.isEmpty(_cache) && fis.util.md5(file.getContent()) != _cache.md5) {

			_cache = {};
		}
		//解决css可读时,若js中使用了require('/xx.css')，js就不使用cache.
		/*if(!fis.util.isEmpty(_cache) && (alp.config.get('readcss') && file.isJsLike || alp.config.get('readcssInHtml') && file.isHtmlLike)){
			if(/((\.less)|(\.s?css)|\.(sass)|(\.styl))/.test(file.requires.join(','))){
				_cache = {};
				console.log(file.basename);
			}
		}*/


		if (!fis.util.isEmpty(_cache)) {
			file.rawContent = file.getContent();
			file.setContent(_cache.content);

			file.ext !== '.html' && file.ext !== '.htm' && ret.map.res[id] && (ret.map.res[id].adeps = _cache.map.adeps);

		} else {
			if (file.ext !== '.html' && file.ext !== '.htm') {
				_result = parseNonHtml(file.fullname);
			} else {

				_result = hParser(id, file, ret, alp_conf);
				file.setContent(_result[_id].content);
			}
			fis.util.merge(result, _result);
		}
	});


	writeCache(result);

	cache.flush();
	/**
	 * 写入缓存，同事更新fis的缓存
	
	 */
	function writeCache(result, file) {
		var _k;
		for (var k in result) {
			_k = k.replace(/[\/\\]/gi,'/');
			cache.write(_k, result[k], function(k, content) {
				var file, dep = {},
					aFile,
					fullname, timestamp;
				deps = content.map.adeps;
				k = pth.normalize(k);

				aFile = allFiles[k];
				file = aFile.file;
				for (var i = 0, len = deps.length, _dep, _file; i < len; i++) {
					_dep = deps[i];

					file.cache.addDeps(_dep);

				}

				deps.length && file.cache.save(aFile.rawContent, {
					requires: file.requires,
					extras: file.extras
				});

			});
			ret.ids[k] && ret.ids[k].setContent(result[k].content);
			ret.map.res[k] && (ret.map.res[k].adeps = result[k].map.adeps);
		}
	}

	function modifyHtmlContent(content, fullname, id, regExp, htmlAdeps) {

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
				retObj = ret.ids[relsrc.replace(/[\/\\]/gi,'/')];
				if (retObj) {
					return retObj.rawContent || retObj.getContent();
				} else {
					return fis.util.read(src).toString();
				}

			}
		});
	}

};