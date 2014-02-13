/**
 * Module dependencies
 */
var Readable = require('stream').Readable
	, _ = require('lodash')
	, util = require('util');


// Extend Readable
util.inherits(Upstream, Readable);

/**
 * Constructor
 * @param {[type]} opts [description]
 */
function Upstream (opts) {
	opts = opts || {};
	_.defaults(opts, {
		objectMode: true
	});

	Readable.call(this, opts);

	// todo: make it actually do things instead of just using timeouts
	var self = this;
	setTimeout(function () {
		self.onFile({});
	}, 15);
	setTimeout(function () {
		self.onNoMoreFiles();
	}, 35);
}




Upstream.prototype._read = function onNewDataRequested ( numBytesRequested ) {
	// Don't really need to do anything in here--
	// We'll push to the stream when we're ready.
};



/**
 * upload()
 *
 * Convenience method to pipe to a write stream
 * and provide a traditional node callback.
 * 
 * @param  {stream.Writable}   receiver__
 * @param  {Function} cb
 */
Upstream.prototype.upload = function ( receiver__, cb ) {
	receiver__.on('finish', function allFilesUploaded (files) {
		cb(null, files);
	});
	receiver__.on('error', function unableToUpload (err) {
		cb(err);
	});
	this.pipe( receiver__ );
};



Upstream.prototype.onFile = function (file) {
	// console.log('on incoming file');
	this.push(file);
};



Upstream.prototype.onNoMoreFiles = function () {
	// console.log('on incoming end');
	this.push(null);
};


module.exports = Upstream;








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
