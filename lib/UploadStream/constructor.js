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

	// TODO:
	// pull options defaults into UploadStream itself
	// and expect an `options` arg instead of `fieldName` for the constructor
	// so we can eliminate this closure.


	/**
	 * UploadStream
	 *
	 * Constructor.
	 * 
	 * @param  {[type]} fieldName [description]
	 */

	function UploadStream (fieldName) {
	
		// Keep track of field(s) which are writing to this UploadStream.
		this.fieldName = fieldName;

		// Keep track of things which are consuming this upload stream.
		this.connectedTo = [];

		// if (fieldName !== 0 && fieldName !== '' && !fieldName) {
			// log('Unified upload stream now listening to all fields (multiple file upload)...');
		// }
		// else {
			// log('Instantiated an upload stream for the file detected in `' + this.fieldName + '`...');
		// }

		this.writable = true;
		_.bindAll(this);

		// Keep track of files written through this stream
		this.files = {};
		this.fileStreams = {};

		// Zero out global bytesWritten counter
		// (byte sum of ALL files uploaded via THIS UploadStream)
		this._bytesWritten = 0;

		// Immediately psuedo-"pause" the stream.
		// (implements resumable interface-- will remain paused until it is "_resume"d.)
		// Bytes written in the meantime will be buffered to memory.
		Resumable(this);

		
		// Note that `maxBytes` et. al. is set as Infinity.
		// Until they are overridden, these properties shouldn't be relied upon.
		this.maxBytes = Infinity;
		this.maxBytesPerFile = Infinity;

		// Instead, an UploadStream's quota should be enforced on its way
		// to the blob adapter. If a client tries to upload a file to an endpoint
		// that doesn't use a blob adapter, or the blob adapter doesn't get used for
		// a long time, it is possible the request will never be terminated.
		// 
		// This is why `maxBufferTime` exists.  It functions as a timeout for the UploadStream.
		// i.e. if an upload is buffering for too long, the maxBufferTime timeout will dump
		// its buffered bytes and proceed to ignore it.
		// 
		// This option helps protect against the most basic kinds of DoS
		// attacks that could be launched against a server using file uploads, while also
		// giving us maximum flexibility to provide different byte limits on a per-use-case basis.

		var thisUploadStream = this;
		// console.log('Setting maxBufferTimer on UploadStream: `' + this.fieldName + '`');
		// console.log('(will buffer for maximum of '+options.maxBufferTime+'ms)');
		this.maxBufferTimer = setTimeout(function startIgnoringUploadStream() {
			// console.log('maxBufferTimer went off for '+thisUploadStream.fieldName);

			var inUse = thisUploadStream.connectedTo && thisUploadStream.connectedTo.length;

			// TODO: get a hold of this information:
			var isStillPaused = true;


			// If the stream is no longer buffering/paused, we're good!
			// Just bail out.
			if ( !isStillPaused ) {
				return;
			}


			// If this UploadStream is `inUse`, it shouldn't still be buffering/paused.
			// However, it might be experiencing backpressure from the blob adapter,
			// or be trying to write to a blob adapter which does not correctly implement _resume.
			// So we'll allow the file to continue to buffer for now.
			if (inUse) {
				console.log(util.format('Allowing the continued buffering of UploadStream:  `%s`', thisUploadStream.fieldName));
				console.log('(it is `connectedTo` :', util.inspect(thisUploadStream.connectedTo));
				
				// TODO:
				// Set a second timeout which limits continued buffering to a couple of seconds.
				return;
			}


			// Otherwise, if this UploadStream is still buffering/paused, but not being consumed
			// by anything, we'll drop it and ignore all future events from it.
			thisUploadStream.end(
				util.format('Upload stream exceeded maxBufferTime (%sms)!', options.maxBufferTime)
				// TODO: better error message
			);
			return;

		}, options.maxBufferTime);
	}



	// UploadStream extends the `Stream` base class from Node core.
	util.inherits(UploadStream, Stream);



	return UploadStream;
};

