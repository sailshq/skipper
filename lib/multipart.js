/**
 * Module dependencies
 */

var _ = require('lodash')
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
		
		return newUpstream();
	};
}







/**
 * For now: factory
 * @return {stream.Readable}
 */
function newUpstream () {
	var Readable = require('stream').Readable;
	var __rs = new Readable({objectMode: true});
	__rs._read = function onNewDataRequested ( numBytesRequested ) {
		// Don't really need to do anything in here--
		// we'll write to the stream when we're ready.
	};

	// Add the `upload` method for convenience
	__rs.upload = function ( receiver__, cb ) {
		receiver__.on('finish', function allFilesUploaded (files) {
			cb(null, files);
		});
		receiver__.on('error', function unableToUpload (err) {
			cb(err);
		});
		this.pipe( receiver__ );
	};


	//
	// Source wrapper
	// 
	function onFile (file) {
		// console.log('on incoming file');
		__rs.push(file || {});
	}
	function onNoMoreFiles () {
		// console.log('on incoming end');
		__rs.push(null);
	}

	// todo: make it actually do things instead of just using timeouts
	setTimeout(onFile, 15);
	setTimeout(onNoMoreFiles, 35);

	return __rs;
}




/**
 * Possible future implementation of Upstream:
 * Given an EventEmitter which emits incoming file streams
 * as they are detected, return a readable stream that
 * can be reconstituted using Substack's emitStream
 * (https://github.com/substack/emit-stream#example)
 * 
 * @param  {EventEmitter} emitter
 * @return {Stream}
 */
