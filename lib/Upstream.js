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

	// Keep track of file streams which we've emitted.
	this._files = [];

	Readable.call(this, opts);
}




Upstream.prototype._read = function onNewDataRequested ( numBytesRequested ) {
	// Don't really need to do anything in here--
	// We'll push to the stream when we're ready.
	// console.log('Something is trying to read from an Upstream.');
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

	// Write stream finished successfully!
	receiver__.once('finish', function allFilesUploaded (files) {
		console.log('receiver finished)');
		cb(null, files);
	});

	// Write stream encountered a fatal error and had to quit early!
	// (some of the files may still have been successfully written, though)
	receiver__.once('error', function unableToUpload (err, files) {
		console.error('receiver error)');
		cb(err);
	});

	this.pipe( receiver__ );
};



Upstream.prototype.writeFile = function ( filestream ) {

	// Track incoming file stream in case we need
	// to cancel it:
	this._files.push({
		stream: filestream,
		status: 'bufferingOrWriting'
	});


	// Pump out the new file
	// (Upstream is a Readable stream, remember?)
	this.push(filestream);
	console.log('IncomingUpload: Pumping a file in field `'+this.fieldName+'`');
};



/**
 * Called by parser implementation to signal the end of the Upstream.
 * (i.e. no more files are coming)
 * 
 * Anyone trying to `read()` Upstream will no longer be able to get
 * any files from it.
 * 
 */
Upstream.prototype.noMoreFiles = function () {
	console.log('IncomingUpload: No more files will be sent in field `'+this.fieldName+'`');
	this.push(null);
};




/**
 * Called by parser implementation to signal a fatal error with one or more
 * files being pumped by this Upstream.
 * 
 * All future files on this Upstream are cancelled (stop listening to file parts)
 * and any currently-uploading files are invalidated.
 *
 * @param  {Error} err
 */
Upstream.prototype.fatalIncomingError = function (err) {

	console.log('Fatal incoming error in MPU form!');

	// Emit an error event to any of file streams in this Upstream
	// which are still being consumed.  Any `receiver__`s reading this
	// Upstream are responsible for canceling the upload and garbage-collecting
	// any bytes which were already written to the destination(s).
	_(this._files).each(function (file) {
		file.status = 'cancelled';
		file.stream.emit('error', err);
	});

	// Indicate the end of the Upstream (no more files coming)
	this.noMoreFiles();
};




module.exports = Upstream;

