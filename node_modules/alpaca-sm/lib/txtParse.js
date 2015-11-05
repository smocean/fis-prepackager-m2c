var _ = alp._;

var CleanCss;

var uglifyJs;

var cleanCssOptions;

function getCleanCss() {
	if (!CleanCss) {
		CleanCss = require('clean-Css');
		cleanCssOptions = alp.config.get('settings.optimizer.css');
	}
	return CleanCss;
}

function getRegExp() {

	word = alp.config.get('word') || 'require';

	return new RegExp('@?\\b' + word + '\\b\\s*\\(\\s*[\'\"]{1}([^\'\"]+)[\'\"]{1}\\s*\\);*', 'gi');

}

function txtParse(opt) {
	var base = alp.config.get('base'),
		regExp, _content, dir,
		depsObj = {},
		deps = [],
		cnt,
		content;

	src = opt.src;
	cnt = opt.cnt;
	if (_.is(cnt, 'function')) {
		content = cnt(src, base);
	}
	if (_.is(cnt, 'undefined')) {
		if (_.isFile(src) && _.extname(src) !== 'js' && _.isTextFile(src)) {

			content = _.read(src);
		} else {
			console.log(2)
			alp.log.error('unable to find [' + src + ']:No such file');
		}
	}

	dir = _.path.dirname(src);

	content = content.toString();

	regExp = getRegExp();

	_content = content.replace(regExp, function() {
		var args = [].slice.call(arguments, 0),
			raw = args[1],
			absUrl = _.path.resolve(dir, raw),
			relUrl = _.path.relative(base, absUrl);

		if (relUrl in depsObj) {
			return '';
		}
		depsObj[relUrl] = {
			absUrl: absUrl,
			url: relUrl,
			raw: raw
		};

		deps.push(relUrl);

		return '';
	});
	return {
		obj: depsObj,
		deps: deps,
		content: content
	}
}

function traverseNonJs(opt, result) {
	var deps = [],
		key, base = alp.config.get('base'),
		src = opt.src;


	key = _.path.relative(base, src);
	if (_.isFile(src)) {
		console.log(result);

		if (!(key in result)) {
			result[key] = txtParse(opt);
			result[key].base = base;
			deps = result[key].obj;

		}

	} else {
		alp.log.error('unable to find [' + src + ']:No such file');
	}

	for (var rel in deps) {
		if (_.isFile(deps[rel].absUrl)) {
			if (!(rel in result)) {
				arguments.callee.call(this, {
					src: deps[rel].absUrl
				}, result);
			}
		}
	}

}

function buildMap(key, result, map) {
	var deps = result[key].deps;
	map = map || [];

	for (var ci, len = deps.length, i = len - 1; ci = deps[i], i >= 0; i--) {

		if (key in result[ci].obj) {
			alp.log.error('Existence of circular dependency in file [' + ci + '] and file [' + path + ']')
		}

		map.unshift(ci);

		arguments.callee(ci, result, map);

	}

	for (var j = 0, mapKey = {}, cj; cj = map[j]; j++) {
		if (cj in mapKey) {
			map.splice(j, 1);
		} else {
			mapKey[cj] = true;
		}
	}

	return map;

}

function parse(opt, _result) {
	var obj,
		result = {};
	_result = _result || {};

	traverseNonJs(opt, _result);

	for (var rel in _result) {
		obj = _result[rel];
		result[rel] = {
			content: generateContent(obj.content, _.extname(rel) === 'css', opt.minCallback),
			map: {
				deps: obj.deps,
				base: obj.base,
				adeps: buildMap(rel, _result)
			}
		}
	}

	return result;
}

function generateContent(content, isCss, minCb) {
	var isMinifile = alp.config.get('optimizer');

	if (isMinifile && isCss) {
		if (!_.is(minCb, 'function')) {
			minCb = minFile;
		}
		return minCb(content);

	} else if (isMinifile && _.is(minCb, 'function')) {
		return minCb(content) || content;
	} else {
		return content;
	}
}

function minFile(content) {
	var minifier;

	minifier = new(getCleanCss())(cleanCssOptions);

	return minifier.minify(content).styles;

}



module.exports = function(opt, result) {
	return parse(opt, result);
}
module.exports.parse = txtParse;