var CONFIG = {
	ns: "alp",
	exclude: [],
	txtType: [],//扩展已有的文本类型['txt','js']
	main: {
		include: [],
		exclude: []
	},
	optimizer: true,
	base: process.cwd(),
	word: 'require',
	readcss: true,
	settings: {
		optimizer: {
			css: {
				processImport: false,
				keepSpecialComments: '*' //只对‘/*!我是注市有效*/’
			},
			js: {
				fromString: true
			}
		}
	}
}

function merge(source, target) {
	if (typeof source === 'object' && typeof target === 'object') {
		for (var key in target) {
			if (target.hasOwnProperty(key)) {
				source[key] = merge(source[key], target[key]);
			}
		}
	} else {
		source = target;
	}
	return source;
}

function Config(config) {
	this.config = merge(config, CONFIG);
}


Config.prototype = {
	set: function(key, value) {
		if (typeof value !== 'undefined') {

			key = String(key || '').trim();
			if (key) {
				var paths = key.split('.'),
					last = paths.pop(),
					data = this.config || {};
				paths.forEach(function(key) {
					var type = typeof data[key];
					if (type === 'object') {
						data = data[key];
					} else if (type === 'undefined') {
						data = data[key] = {};
					} else {
						alp.log.error('forbidden to set property[' + key + '] of [' + type + '] data');
					}
				});
				data[last] = value;
			}
		}
	},
	get: function(keyPath) {
		var keys = keyPath.split('.'),
			key,
			config = this.config;
		for (var i = 0, len = keys.length; i < len; i++) {
			key = keys[i];
			if (i == len - 1) {
				return config[key];
			} else if (key in config) {
				config = config[key];
			} else {
				return;
			}
		}
	},
	merge: function(config) {
		this.config = merge(this.config, config);
	}
}

module.exports = new Config({});

module.exports.Config = Config;