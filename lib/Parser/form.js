/**
 * Module dependencies
 */

var multiparty = require('multiparty');


module.exports = function () {

	var form = new multiparty.Form();
	return form;
};
