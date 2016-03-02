var Cache = require('./lib/cache.js');

var alp = require('alpaca-sm');

module.exports = function(ret, conf, settings, opt) {
    var alpConf = {},
        cache = new Cache(!!opt.optimize, ret),
        allFiles = {};

    settings['isOptimizer'] = !!opt.optimize;

    alpConf = fis.util.merge(alpConf, settings);

    alpConf.root = fis.project.getProjectPath();

    alpConf.fileBasedRoot = true;

    alpConf.readable = {
        css: false,
        cssInHTML: false
    };

    alp.config.merge(alpConf);

    fis.util.map(ret.src, function (id, file) {
        var _cache;

        if (!file.isHtmlLike && !file.isCssLike && !file.isJsLike) {
            return;
        }
        id = id.replace(/^[\/]*/, '');
        allFiles[id] = {
            file: file,
            rawContent: file.getContent()
        };
        _cache = cache.read(id);

        //解决文件内容依赖其它文件的情况比如使用了inline方式
        if (!file.cache || fis.util.isEmpty(_cache)) {
            _cache = {};
        }

        if (!fis.util.isEmpty(_cache)) {
            file.rawContent = file.getContent();
            file.setContent(_cache._content);
            !file.isHtmlLike && ret.map.res[id] && (ret.map.res[id].adeps = _cache.aRequires);
        } else {
            alp.processor({
                src: file.realpath,
                contentProcessor: function (file) {
                    var retObj;

                    retObj = ret.src['/' + file.subpath];
                    if (retObj) {
                        return retObj.rawContent || retObj.getContent();
                    } else {
                        return file.getRawContent();
                    }
                }
            });
            file.rawContent = file.getContent();
            file.setContent(alp.storage[id].getContent());
        }

    });

    writeCache(alp.storage);

    cache.flush();

    function writeCache(storage) {

        for (var k in storage) {
            cache.write(k, storage[k], function (k, cfile) {
                var file,
                    aFile,
                    deps = [];

                deps = cfile.aRequires;

                aFile = allFiles[k];

                file = aFile.file;

                for (var i = 0, len = deps.length, _dep; i < len; i++) {
                    _dep = deps[i];

                    file.cache.addDeps(_dep);
                }

                deps.length && file.cache.save(aFile.rawContent, {
                    requires: file.requires,
                    extras: file.extras
                });
            });
            ret.ids[k] && ret.ids[k].setContent(storage[k].getContent());
            if (ret.map.res[k]) {
                ret.map.res[k].adeps = storage[k].aRequires;
            } else {
                ret.map[k] = {
                    type: storage[k].rExt,
                    url: '/' + k,
                    deps: storage[k].requires,
                    adeps: storage[k].aRequires
                }
            }


        }
    }

};