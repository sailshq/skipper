/**
 * Module dependencies
 */

var _ = require('lodash'),
	Stream = require('stream'),
	util = require('util'),
	Resumable = require('../resumable');


/**
 * @return {UploadStream.constructor}
 */
module.exports = function (options) {

	/**
	 * UploadStream
	 *
	 * Constructor.
	 * 
	 * @param  {[type]} fieldName [description]
	 */
	function UploadStream (fieldName) {
	
		// Fieldname is only saved so that we can create useful logs
		this.fieldName = fieldName;
		if (fieldName !== 0 && fieldName !== '' && !fieldName) {
			// log('Unified upload stream now listening to all fields (multiple file upload)...');
		}
		else {
			// log('Instantiated an upload stream for the file detected in `' + this.fieldName + '`...');
		}

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
		Resumable(this);

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

	// UploadStream extends the Stream base class in node
	util.inherits(UploadStream, Stream);

	return UploadStream;
};

