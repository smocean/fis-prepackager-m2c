var _ = alp._;

function doPath(opt) {

	if (!_.isTextFile(opt.src)) {
		opt.src += '.js';
	}
	return opt;

}


module.exports = function(opt, cssCb) {
	var result = {},
		_result;
	opt = doPath(opt);
	if (_.isJsFile(opt.src)) {
		return alp.jsParse(opt, cssCb);
	} else {
		return alp.txtParse(opt);
	}

}