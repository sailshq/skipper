/**
 * Module dependencies
 */

var Request = require('request');
var _ = require('lodash');



/**
 *
 * @param  {Object} optionalOptions
 * @param  {Function} optionalCallback
 * @return {HTTPRequest}
 */
module.exports = function getUploader ( optionalOptions, optionalCallback ) {

	var opts = optionalOptions || {};
	_.defaults(opts, {
		baseurl: 'http://localhost:3000',
	});
	_.defaults(opts, {
		url: opts.baseurl+'/upload'
	});

	// Bootstrap an HTTP client
	var httpClient__outs =
	(optionalCallback)
		? Request.post(opts.url, optionalCallback)
		: Request.post(opts.url);

	return httpClient__outs;
};
