/**
 * Module dependencies
 */

var _ = require('lodash')
	, multiparty = require('multiparty')
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


		// Fire up 'ole multiparty
		var form = new multiparty.Form();
		form.parse(req);

		form.on('error', function (err) {
			//
			// todo:
			// make sure all subsequent uploads are aborted
			// (since this is a global fatal error)
			// 
			return next(err);
		});
		form.on('part', function (part) {
			
			// Let the `.on('field') handler take care of non-files.
			if ( !part.filename ) return;

			// todo: handle files
			console.log('got file ::',part.filename);
		});
		form.on('field', function (field, value) {
			console.log('got field ', '`'+field+'`','::',value);
		});

		next();
	};
};





/**
 * 
 * @param  {[type]} reqBodyPartStream [description]
 * @return {[type]}                   [description]
 */
function onPart ( reqBodyPartStream ) {
	console.log('onPart!');
	//reqBodyPartStream;
}


/**
 * 
 * @param  {[type]} param [description]
 * @return {[type]}       [description]
 */
function onTextParam ( param ) {
	// TODO:
}


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
