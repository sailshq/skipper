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
 * Called by parser implementation to signal an INCOMING fatal error
 * with one or more files being pumped by this Upstream.
 * This means that something went wrong or cancelled the entire file upload on the
 * "source" side (i.e. the request), and that we should invalidate the entire
 * upload.  An example of this scenario is if a user aborts the request.
 *
 * ------------------------------------------------------------------------
 * TODO:
 * Probably can deprecate this, since you almost always want to retain the
 * files that were already uploaded in this case.
 * ------------------------------------------------------------------------
 * 
 * All future files on this Upstream are cancelled (stop listening to file parts)
 * and any currently-uploading files are invalidated.
 *
 * @param  {Error} err
 */
Upstream.prototype.fatalIncomingError = function (err) {

	console.log('Fatal incoming error in MPU form ::',err,' (user may have cancelled the request..?)  Aborting/cancelling all future, current, and previously uploaded files from this request!');

	// Emit an error event to any of file streams in this Upstream
	// which are still being consumed.
	// 
	// Any `receiver__`s reading this Upstream are responsible for listening to
	// 'error' events on the incoming file readstream(s).  On receipt of such a
	// "READ" error, they should cancel the upload and garbage-collect any bytes
	// which were already written to the destination writestream(s).
	//
	// Receivers should, of course, ALSO listen for "WRITE" errors ('error' events on
	// the outgoing writestream for each file.  The behavior is probably pretty much
	// the same in both cases, although a receiver might, for instance, choose to retry using
	// exponential back-off in the case of a "WRITE" error.  But on receiving a "READ" error,
	// it should always immediately stop.  This is because such an error is usually more
	// serious, and might even be an indication of the user trying to cancel a file upload.
	_(this._files).each(function (file) {
		file.status = 'cancelled';
		file.stream.emit('error', err);
	});

	// Indicate the end of the Upstream (no more files coming)
	this.noMoreFiles();


	// Finally, emit error on this Upstream itself to cause some real trouble.
	// If this Upstream is connected to something, this will trigger the error handler
	// on the receiving writestream, which might contain special behavior.
	// Otherwise, the error will be handled by the Parser, which will terminate the
	// request.
	this.emit('error', err);

};




module.exports = Upstream;

