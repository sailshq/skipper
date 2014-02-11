	/**
	 * Module dependencies
	 */

	var inherits = require('util').inherits,
		Stream = require('stream'),
		util = require('util');
		_ = require('lodash');

module.exports = function(options) {
	var log = require('./logger')(options);


	// Require Resumeable inside of wrapper function
	// to guarantee there are no memory collisions.
	// This should be replaced with proper node stream
	// buffering when formidable is compatible  (or we replace it...)
	var Resumeable = require('./Resumable');


	// TODO: 
	// implement https://npmjs.org/package/lazystream
	// to deal with `too many open files` issues that are likely
	// to come up in production


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
	inherits(UploadStream, Stream);
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
		console.log('Setting maxBufferTimer on ' + this.fieldName + ' to '+options.maxBufferTime+'ms...');
		this.maxBufferTimer = setTimeout(function startIgnoringUploadStream() {
			console.log('***\n***Upload stream exceeded maxBufferTime ('+options.maxBufferTime+')!');
			self.end('Upload stream exceeded maxBufferTime ('+options.maxBufferTime+')!');
		}, options.maxBufferTime);
	}



	/**
	 * Signal the start of a new file upload
	 *
	 * @emits {Stream} fileStream
	 *			binary stream of data for the file, paused
	 *			until `fileStream._resume()` is called
	 */

	UploadStream.prototype.write = function(fileStream) {

		var uploadStream = this;



		// Keep track of files which have been sent through this fileStream
		// and reset the file's upload metadata
		// (e.g. zero out bytesWritten counter for newly detected file)
		this.files[fileStream._id] = {
			field: fileStream.fieldName,
			filename: fileStream.filename,
			size: 0,
			mime: fileStream.mime,
			headers: fileStream.headers,
			transferEncoding: fileStream.transferEncoding,
			_id: fileStream._id
		};

		// Save ref to stream
		this.fileStreams[fileStream._id] = fileStream;

		log.verbose('UploadStream.write() ::', fileStream.filename);

		// Listen for chunks coming down the field stream
		// and run this.interrupt
		fileStream.on('data', function receiveBinaryData(newBytes) {

			var logmsg = '';
			if (!uploadStream.fieldName &&
				uploadStream.fieldName !== 0 &&
				uploadStream.fieldName !== '') {
				logmsg += 'Unified (multi-upload) stream :: ';
			} else logmsg += 'Field stream :: "' + uploadStream.fieldName + '" ';
			log.verbose(logmsg + 'received ' + newBytes.length + 'B chunk of "' + this.filename + '"...');

			// Calculate the total # of bytes written on this FileStream 
			// within this UploadStream
			// (necessary for enforcing per-file upload limits on filesize)
			var fileRecord = uploadStream.files[fileStream._id];
			console.log(fileRecord.filename + ' :: writing-- size is now::::::  ', fileRecord.size);
			fileRecord.size += newBytes.length;

			// Increment the total # of bytes written 
			// across ALL of the FileStreams in this UploadStream
			uploadStream._bytesWritten += newBytes.length;

			// Whenever a new update comes in, check that upload limit
			// constraints are not violated- if they are, break the stream
			var valid = true;
			valid = valid && uploadStream.enforceMaxBytes(uploadStream._bytesWritten, this);
			valid = valid && uploadStream.enforceMaxBytesPerFile(fileRecord.size, this);

			// // If invalid, bail out now so we don't write anything.
			// if (!valid) return;

			// TODO: streaming encryption (crypto streams? http://nodejs.org/api/crypto.html)
			// TODO: also streaming compression? (zlib? http://nodejs.org/api/zlib.html)
			// TODO: progress update event fired?
			// TODO: thumbnail generation? (imagemagick) -> adds new filestreams to uploadstream

			// Pass new data buffer to be written (`newBytes`)
			// as well the file stream, to the overridable `onFileData` fn
			uploadStream.onFileData(newBytes, fileStream);
		});


		// Unsubscribe from all data events when the stream ends.
		fileStream.on('end', function () {
			fileStream.removeAllListeners('data');
		});


		// Emit paused field stream (from MPU) on upload stream
		this.emit('data', fileStream);
	};



	/**
	 * Notify listeners on the stream that the upload is complete.
	 */

	UploadStream.prototype.end = function(err) {
		log();
		log(' * `end()` was called on an UploadStream ::');
		if (this.fieldName) log('     '+this.fieldName);
		if (err) log('     ERROR:',err);
		log('     files :: '+_.pluck(this.files, 'filename') );
		log('     bytes received :: '+this._bytesWritten);

		console.log('ENDING UPLOAD STREAM ('+this.fieldName+')' + (err ? ' WITH ERROR:'+err : ''));

		// Cancel maxBufferTimer
		clearTimeout(this.maxBufferTimer);

		// Unsubscribe to data events on all fileStreams.
		_.each(this.fileStreams, function (stream) {
			stream.removeAllListeners('data');
		});

		// Emit 'end' event, setting this uploadStream's fatalError
		// as an argument if it exists.
		this.emit('end', err);
	};



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
	 * Enforce file upload limits
	 */

	UploadStream.prototype.enforceMaxBytes = function(totalBytesWritten, fileStream) {

		// Enforce combined file upload limit
		if (totalBytesWritten <= this.maxBytes) {
			return true;
		}


		// log('Enforcing ' + this.maxBytes + 'B upload limit..!  Quota exceeded!');

		// Build error object
		var bytesExceeded = totalBytesWritten - this.maxBytes;
		var quotaExceededError = {
			status: 'Forbidden',
			message: 'Quota exceeded :: ' + (totalBytesWritten/1000) + 'kB upload exceeds `maxBytes` (' + (this.maxBytes/1000) + 'kB) by at least ' + (bytesExceeded/1000) + 'kB.  Upload cancelled.',
			totalBytesWritten: totalBytesWritten,
			maxBytes: this.maxBytes,
			bytesExceeded: bytesExceeded
		};

		log(this.maxBytes + 'B upload limit exceeded for ' +
			(this.fieldName ? '`req.file("'+this.fieldName+'")`' : '`req.files`')+
			'!');

		// Trigger the `end` of the upload stream, so that no more files show up,
		// passing along a descriptive error argument
		console.log('AHAHHHHH QUOTA EXCEEDED',quotaExceededError);
		this.end(quotaExceededError);



		// This DOES NOT, however, trigger the end of the current field/part stream.
		// But is that even what we want to do?  Yes, and here's why:
		// If a `maxBytes` constraint is validated, the underlying
		// read stream (usually a HTTP request) will be ended.
		// This is so no more bytes will show up for this file upload, which is good.
		// That said, it will stop the stream, meaning that any other instance of UploadStream
		// depending on that fileStream will no longer be able to read from the stream.
		//
		// For example:
		// Let's say we're listening through `req.files` to a file upload sent with the form-data
		// field name "foo".  If the file violates a constraint, it will be rejected not only
		// on `req.files`, but also on `req.file('foo')`

		// This line prevents incoming data events for the fileStream
		// from continuing to write to this, OR ANY, upload stream.
		fileStream.removeAllListeners('data');


		// Now we've prevented more incoming data from hitting us, and we know that this stream
		// is essentially dead.  If this is the universal stream, do nothing.
		// TODO: do something smarter and make the universal stream still work.
		if ( !fileStream.fieldName ) {
			var doSomethingSmarter;
			log('Universal file upload stream was halted because it exceeded `maxBytes`.');
		}

		// If this is the stream for a specific file listener, subtract the bytes of the
		// stream from the totalBytesWritten that we're tracking.  Since that will be garbage-collected
		// anyway, this allows us to ignore the big file and continue to upload other files, since we may
		// still be able to upload them without exceeding maxBytes.
		else {
			var doSomethingElseSmarter;
			log('File upload stream for ' + fileStream.fieldName + ' was halted because `maxBytes` was exceeded.');
		}

		return false;
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