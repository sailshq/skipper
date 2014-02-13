/**
 * Module dependencies
 */

var Parser = require('./Parser')
	, _ = require('lodash');


/**
 * Parse a multipart HTTP request.
 *
 * @param  {Object|nil} options
 * @return {Middleware}
 */

module.exports = function toParseMultipartHTTPRequest (options) {
	return function _parseMultipartHTTPRequest (req, res, next) {
		
		//
		// Conventions:
		//  + Any other logic which mutates `req` should go in this file.
		//  + Try not to pass direct access to `req` to other modules (violating this currently)
		//  + Try not to pass direct access to `next` to other modules (violating this currently)
		// 


		// Namespace a property on `req` and instantiate a Parser
		// to put in there.
		var parser = req._fileparser = new Parser(req, options, next);

		// Expose `req.file(...)` method
		req.file = _.bind(parser.acquireUpstream, parser);

	};
};
