/**
 * Module dependencies
 */

var inherits	= require('util').inherits,
	Stream		= require('stream'),
	Resumeable	= require('./Resumable'),
	_			= require('lodash');




/**
 * Expose stream constructor
 *
 * NOTE: UploadStreams are paused upon initialization
 */

module.exports = UploadStream;




/**
* UploadStream
*
* A stream of signal events, each of which contains 
* a paused multipart stream from Formidable. 
*
* Paused on initiatialization (resume with `instance.resume()`)
* Resumed automatically by any compatible streaming binary adapter
* in Sails.
*
* @implements Writable
* @implements Resumeable
* @extends {Stream}
*/

inherits(UploadStream, Stream);
function UploadStream (fieldName) {

	// Fieldname is only saved so that we can create useful logs
	this.fieldName = fieldName;
	if (fieldName !== 0 && fieldName !== '' && !fieldName) {
		console.log('Unified upload stream now listening to all fields (multiple file upload)...');

	}
	else console.log('New upload stream listening to '+ this.fieldName + '...');

	this.writable = true;
	_.bindAll(this);

	// Keep track of files written through this stream
	this.files = {};

	// Zero out global bytesWritten counter
	// (byte sum of ALL files uploaded via this UploadStream)
	this._bytesWritten = 0;

	// Immediately pause and buffer stream
	// (implements resumable interface)
	Resumeable(this);

	// Default options
	this.maxBytes = 1000 * 1000 * 1000; // 1GB
	this.maxBytesPerFile = 1000 * 1000 * 25; // 25MB

}



/**
 * Signal the start of a new file upload
 *
 * 	@emits {Stream} fileStream
 *			binary stream of data for the file, paused
 *			until `fileStream._resume()` is called
 */

UploadStream.prototype.write = function( fileStream ) {

	var uploadStream = this;

	// Keep track of files which have been sent through this fileStream
	// and reset the file's upload metadata
	// (e.g. zero out bytesWritten counter for newly detected file)
	this.files[fileStream._id] = {
		field			: fileStream.fieldName,
		filename		: fileStream.filename,
		size			: 0,
		mime			: fileStream.mime,
		headers			: fileStream.headers,
		transferEncoding: fileStream.transferEncoding,
		_id				: fileStream._id
	};

	console.log('UploadStream.write() ::', fileStream.filename);

	// Listen for chunks coming down the field stream
	// and run this.interrupt
	fileStream.on('data', function receiveBinaryData (newBytes) {

		var logmsg = '';
		if ( !uploadStream.fieldName &&
				uploadStream.fieldName !== 0 && 
				uploadStream.fieldName !== '' ) {
			logmsg += 'Unified (multi-upload) stream :: ';
		}
		else logmsg += 'Field stream :: "' + uploadStream.fieldName + '" ';
		console.log(logmsg + 'received ' + newBytes.length + 'B chunk of "' + this.filename + '"...');

		// Calculate the total # of bytes written on this FileStream 
		// within this UploadStream
		// (necessary for enforcing per-file upload limits on filesize)
		var fileRecord = uploadStream.files[fileStream._id];
		fileRecord.size += newBytes.length;

		// Increment the total # of bytes written 
		// across ALL of the FileStreams in this UploadStream
		uploadStream._bytesWritten += newBytes.length;

		// Whenever a new update comes in, check that upload limit
		// constraints are not violated- if they are, break the stream
		uploadStream.enforceMaxBytes( uploadStream._bytesWritten, this );
		uploadStream.enforceMaxBytesPerFile( fileRecord.size, this );

		// TODO: streaming encryption (crypto streams? http://nodejs.org/api/crypto.html)
		// TODO: also streaming compression? (zlib? http://nodejs.org/api/zlib.html)
		// TODO: progress update event fired?
		// TODO: thumbnail generation? (imagemagick) -> adds new filestreams to uploadstream

		// Pass new data buffer to be written (`newBytes`)
		// as well the file stream, to the overridable `onFileData` fn
		uploadStream.onFileData(newBytes, fileStream);
	});


	// Emit paused field stream (from MPU) on upload stream
	this.emit('data', fileStream);
};






/**
 * If err set, emit `error`, otherwise emit `end` event.
 */

UploadStream.prototype.end = function(err) {
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

UploadStream.prototype.onFileData = function (newBytes, fileStream) {
	// override me
};




/**
* Enforce file upload limits
*/

UploadStream.prototype.enforceMaxBytes = function (totalBytesWritten, fileStream) {

	// Enforce combined file upload limit
	console.log('Enforcing ' + this.maxBytes + 'B upload limit...');

	if (totalBytesWritten > this.maxBytes) {

		// Build error object
		var bytesExceeded = totalBytesWritten - this.maxBytes;
		var quotaExceededError = {
			status	: 'Forbidden',
			message	: 'Quota exceeded :: ' + totalBytesWritten + 'B upload exceeds quota (' + this.maxBytes + 'B) by ' + bytesExceeded + 'B.',
			totalBytesWritten: totalBytesWritten,
			maxBytes	: this.maxBytes,
			bytesExceeded: bytesExceeded
		};

		console.error(this.maxBytes + 'B upload limit exceeded!');

		// Trigger the `end` of the upload stream, so that no more files show up,
		// passing along a descriptive error argument
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
		fileStream.removeAllListeners('data');
	}
};


/**
 * Enforce per-file upload size limit
 */

UploadStream.prototype.enforceMaxBytesPerFile = function ( bytesWrittenOfFile ) {
	// TODO
};


