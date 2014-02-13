/**
 * Module dependencies
 */

var _ = require('lodash')
	, Upstream = require('./Upstream')
	, applyDefaultOptions = require('./defaults');


/**
 * Parse a multipart HTTP request.
 *
 * @param  {Object|nil} options
 * @return {Middleware}
 */

module.exports = function toParseMultipartHTTPRequest (options) {
	options = applyDefaultOptions(options);

	return function _parseMultipartHTTPRequest (req, res, next) {

		// Namespace a property on `req` for file-parser to use.
		req._fileparser = {
			upstreams: []  // Track upstreams in play
		};

		// Expose `req.file(...)` method
		req.file = toAcquireUpstream(req._fileparser.upstreams);


		next();
	};
};



/**
 * @param  {Array} upstreams  [upload streams already in-play for this request]
 * @return {Upstream}
 */
function toAcquireUpstream (upstreams) {

	/**
	 * Find the upstream with `fieldName`, or
	 * create it for the first time if necessary.
	 * 
	 * @param  {[type]} fieldName [description]
	 * @return {[type]}           [description]
	 */
	return function acquireUpstream ( fieldName ) {
		var existingStream = _.find(upstreams, {
			fieldName: fieldName
		});
		if (existingStream) return existingStream;
		
		return new Upstream();
	};
}
