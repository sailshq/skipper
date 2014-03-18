/**
 * Module dependencies
 */

var Writable = require('stream').Writable;
var fs = require('fs');
require('colors');




/**
 * Example of a simple receiver for file-parser.
 * This is used for handling file uploads and writing them
 * to a storage container.
 *
 * This is just a super-basic thing that writes files to disk.
 * It does include a garbage-collection mechanism for file uploads
 * which were not successful.
 * 
 * @return {Stream.Writable}
 */

module.exports = function newReceiverStream (options) {
	options = options || {};

	// Default the output path for files to `/dev/null` if no `id` option
	// is passed in (for testing purposes only)
	var filePath = options.id || '/dev/null';

	var receiver__ = Writable({objectMode: true});

	// This `_write` method is invoked each time a new file is received
	// from the Readable stream (Upstream) which is pumping filestreams
	// into this receiver.  (filename === `__newFile.filename`).
	receiver__._write = function onFile (__newFile, encoding, done) {
		var outs = fs.createWriteStream(filePath, encoding);
		__newFile.pipe(outs);

		// Garbage-collect the bytes that were already written for this file.
		// (called when a read or write error occurs)
		function gc (err) {
			console.log('************** Garbage collecting file `'+__newFile.filename+'` located @ '+filePath+'...');
			fs.unlink(filePath, function (gcErr) {
				if (gcErr) return done([err].concat([gcErr]));
				return done(err);
			});
		}


		__newFile.on('error', function (err) {
			console.log('***** READ error on file '+__newFile.filename, '::',err);
		});
		outs.on('error', function failedToWriteFile (err) {
			gc(err);
		});

		outs.on('finish', function successfullyWroteFile () {
			done();
		});

	};
	
	return receiver__;
};
