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
	var outputPath = options.id || '/dev/null';

	var receiver__ = Writable({objectMode: true});

	// This `_write` method is invoked each time a new file is received
	// from the Readable stream (Upstream) which is pumping filestreams
	// into this receiver.  (filename === `__newFile.filename`).
	receiver__._write = function onFile (__newFile, encoding, cb) {

		var outs = fs.createWriteStream(outputPath, encoding);
		__newFile.pipe(outs);
		
		outs.on('finish', function successfullyWroteFile () { cb(); });

		outs.on('error', function failedToWriteFile (err) {
			// Garbage-collect the bytes that were already-written for this file.
			fs.unlink(filePath, function (gcErr) {
				if (gcErr) return cb([err].concat([gcErr]));
				return cb(err);
			});
		});
	};
	
	return receiver__;
};
