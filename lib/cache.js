'use strict';

var pth = require('path');

var m2cVersion = fis.util.readJSON(pth.resolve(__dirname, '../package.json')).version;

function fingerprint(path, optimize) {
	var file = fis.util.realpath(path);
	if (!fis.util.isFile(file)) {
		fis.log.error('unable to cache file[' + path + ']: No such file.');
	}
	return {
		version: fis.version,
		mVersion: m2cVersion,
		timestamp: fis.util.mtime(file).getTime(),
		optimize: optimize
	}
}



function Cache(optimize, dir) {
	dir = dir || 'compile/prepackager' + (optimize ? '-optimize' : '') + '/alpaca-sm';
	this.version = fis.version;
	this.mVersion = m2cVersion;
	var basename = fis.project.getCachePath(dir);
	var hash = fis.util.md5(process.cwd(), 10);
	this.cacheFile = basename + '-a-' + hash + '.tmp';
	if (fis.util.exists(this.cacheFile)) {
		this.cacheContent = fis.util.readJSON(this.cacheFile);
	} else {
		this.cacheContent = {};
	}
	this.optimize = optimize;
};

Cache.prototype = {

	_write: function(content) {

		if (fis.util.is(content, 'string')) {
			try {
				content = JSON.parse(content);
			} catch (e) {
				fis.log.error('write cache content isn\'t JSON');
			}
		}

		this.cacheContent = fis.util.merge(this.cacheContent, content);

	},
	write: function(key, file, callback) {
		if (arguments.length === 1) {
			this._write(key);
		} else if (arguments.length >= 2) {

			file.md5 = fis.util.md5(file.getContent());

			this.cacheContent[key] = fis.util.merge(file, fingerprint(key, this.optimize));
			callback(key, file);
		}


	},
	read: function(path) {
		if (this.exists(path)) {
			return this._getCache(path);
		}
	},
	_getCache: function(path) {
		var cache, flag;

		cache = this.cacheContent[path];
		flag = fingerprint(path, this.optimize);
		if (cache && cache.timestamp === flag.timestamp && cache.version === flag.version && cache.mVersion === flag.mVersion && cache.optimize === flag.optimize) {
			return cache;
		}

		return {};
	},
	clean: function() {

		if (fis.util.exists(this.cacheFile)) {

			this.cacheContent = {};
			this.flush();
		}
	},
	exists: function(path) {
		var cache = this._getCache(path),
			adeps,
			isExist = true;
		if (fis.util.isEmpty(cache)) {
			return false;
		} else {
			adeps = cache.aRequires;
			for (var i = 0, len = adeps.length; i < len; i++) {
				if (fis.util.realpath(adeps)) {
					if (fis.util.isEmpty(this._getCache(adeps[i]))) {
						return false;
					}
				}
				else{
					return false;
				}
			}
		}
		return true;
	},
	flush: function() {
		fis.util.write(this.cacheFile, JSON.stringify(this.cacheContent));
	}

}
module.exports = Cache;