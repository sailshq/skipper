	/**
	 * Module dependencies
	 */

	var Stream = require('stream'),
		util = require('util'),
		_ = require('lodash'),
		logger = require('../logger'),
		Resumeable = require('../resumable');




module.exports = function(options) {
	var log = logger(options);

	// TODO: 
	// implement something like this: (or just use it, if possible)
	// + https://npmjs.org/package/lazystream
	// + https://github.com/jpommerening/node-lazystream
	// 
	// To deal with `too many open files` issues that are likely
	// to come up in certain production use cases.
	// 
	// See: https://github.com/senchalabs/connect/issues/898


	/**
	 * UploadStream
	 *
	 * A stream of signal events, where each signal event contains
	 * a paused multipart "fileStream" from Formidable.
	 *
	 * Examples of uploadstreams:
	 * + req.file('foo')
	 * + req.files
	 * + req.file('bar')
	 *
	 * NOTE: UploadStreams are paused upon instantiation!
	 * (resume with `instance.resume()`)
	 * Resumed automatically by any compatible streaming
	 * binary adapter in Sails.
	 *
	 * This can be made more versatile in the future.
	 * Currently, it is using a custom pause/resume implementation
	 * because formidable is not compatible with the latest Node streams
	 * implementation.
	 *
	 * @implements Writable
	 * @implements Resumeable
	 * @extends {Stream}
	 */
	util.inherits(UploadStream, Stream);
	function UploadStream(fieldName) {
		// Fieldname is only saved so that we can create useful logs
		this.fieldName = fieldName;
		if (fieldName !== 0 && fieldName !== '' && !fieldName) {
			log('Unified upload stream now listening to all fields (multiple file upload)...');

		} else log('Instantiated an upload stream for the file detected in `' + this.fieldName + '`...');

		this.writable = true;
		_.bindAll(this);

		// Keep track of the things which are consuming this upload stream
		this.connectedTo = [];

		// Keep track of files written through this stream
		this.files = {};
		this.fileStreams = {};

		// Zero out global bytesWritten counter
		// (byte sum of ALL files uploaded via THIS UploadStream)
		this._bytesWritten = 0;

		// Immediately pause and buffer stream
		// (implements resumable interface)
		Resumeable(this);

		// Default options
		// 
		// Note that `maxBytes` et. al. is set as Infinity because it shouldn't be
		// be relied upon.  Instead, an upload's quota should be enforced on its way
		// to the blob adapter. If a client tries to upload a file to an endpoint
		// that doesn't use a blob adapter, or the blob adapter doesn't get used for
		// a long time, these limits are theoretically possible.
		// 
		this.maxBytes = Infinity;
		this.maxBytesPerFile = Infinity;
		//
		// This is why `maxBufferTime` is also important as an upload timeout.
		// This option helps protect against the most basic kinds of DoS
		// attacks that could be launched against a server using file uploads.

		var self = this;
		// console.log('Setting maxBufferTimer on ' + this.fieldName + ' to '+options.maxBufferTime+'ms...');
		this.maxBufferTimer = setTimeout(function startIgnoringUploadStream() {
			console.log('***\n***Upload stream exceeded maxBufferTime ('+options.maxBufferTime+')!');


			self.end('Upload stream exceeded maxBufferTime ('+options.maxBufferTime+')!');
		}, options.maxBufferTime);
	}



	
	UploadStream.prototype.write = require('./write');

	UploadStream.prototype.end = require('./end');

	UploadStream.prototype.enforceMaxBytes = require('./enforceMaxBytes');


	/**
	 * `this.onFileData()` is called just before new bytes are written
	 * after built-in binary transformations and constraints
	 * to the underlying adapter's write stream.
	 *
	 * This allows us to get in the middle and enforce constraints, transform the data,
	 * and mixin business logic (but only synchronously)
	 */

	UploadStream.prototype.onFileData = function(newBytes, fileStream) {
		// override me
	};


	/**
	 * Enforce per-file upload size limit
	 */

	UploadStream.prototype.enforceMaxBytesPerFile = function(bytesWrittenOfFile) {
		// TODO
		return true;
	};



	/**
	 * Expose stream constructor
	 *
	 */
	return UploadStream;

};