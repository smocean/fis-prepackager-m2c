var pargram = require('commander'),

	colors = require('colors'),

	alp = require('./index.js'),

	_ = alp._,

	conf_path = _.path.resolve(process.cwd(), 'alp-conf.js'),

	version;

version = _.readJSON(_.path.resolve(__dirname, './package.json')).version;



function buildTag(path) {

	if (_.extname(path) === 'css') {
		return '<link rel="stylesheet" type="text/css" href="' + path + '">\n\r';
	} else if (_.isJsFile(path)) {
		return '<script type="text/javascript" src="' + path + '"></script>\n\r';
	} else {
		return '';
	}

}

function getOutputPath(output, src) {
	return _.path.resolve(output, _.path.relative(alp.config.get('base'), src));
}



module.exports = function(argv) {
	var dest;
	pargram
		.option('-V,--version', 'version info', function() {
			console.log(version.bold.green);

		})
		.command('release')
		.description('analysis dependent and output')
		.option('-d,--dest <path>', 'release output destination', function(src) {
			dest = src;
		})
		.option('-o,--optimize', 'with optimizing')
		.action(function() {
			var result = {},
				conf,
				output,
				base, dirs, deps, _result,
				exclude,
				options = arguments[arguments.length-1];

			if (!_.isFile(conf_path)) {
				alp.log.warning('missing config file [' + conf_path + ']');
			} else {
				require(conf_path);

			}
			if(options.optimize){
				alp.config.set('optimizer',true);
			}
			base = alp.config.get('base');

			output = _.path.resolve(base, dest || 'output');

			dirs = alp.config.get('main.include');
			exclude = alp.config.get('main.exclude') || [];
			exclude.push(_.path.join(output, '**'));
			if (dirs.length === 0) {
				dirs.push(base);
			}
			console.time('');

			for (var i = 0, len = dirs.length; i < len; i++) {
				_.forEachDir(_.path.resolve(base, dirs[i]), function(path) {
					var depName, content, key;

					if (_.isFile(path) && (_.extname(path) === 'html' || _.extname(path) === 'htm') && !_.filter(path, exclude)) {
						_result = alp.txtParse.parse({
							src: path
						});
						content = _result.content;
						var _content;
						deps = _result.deps || [];

						if (deps.length == 0) {
							_.write(getOutputPath(output, path), _result.content);
							return;
						}
						for (var j = 0, jLen = deps.length; j < jLen; j++) {

							result = _.merge(result, alp.parse({
								src: _.path.resolve(base, deps[j])
							}));
							depName = _.path.basename(deps[j]).replace(/\./g, '[.]{1}');

							key = _.path.relative(base, _.path.resolve(base, deps[j]));
							regExp = new RegExp('<!--\\s*\\b' + word + '\\b\\s*\\(\\s*[\'\"]{1}([^\'\"]*)(?=' + depName + ')' + depName + '\\s*[\'\"]{1}\\s*\\)\\s*-->', 'gi');
							content = content.replace(regExp, function() {
								var map = result[key].map.adeps;
								var str = '';
								for (var i = 0, len = map.length; i < len; i++) {

									str += buildTag(_.path.relative(_.path.dirname(path), map[i]));
								}
								str += buildTag(_.path.relative(_.path.dirname(path), key));
								return str;
							});

							_.write(getOutputPath(output, path), content);
							process.stdout.write('.'.green);
						}


					}
				})
			}


			for (var k in result) {
				_.write(getOutputPath(output, k), result[k].content);
				process.stdout.write('.'.green);
			}

			console.timeEnd('');

		});

	pargram.parse(argv);

}