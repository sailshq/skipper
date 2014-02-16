/**
 * Module dependencies
 */

var Writable = require('stream').Writable;
require('colors');




/**
 * Example of a simple receiver stream for file-parser.
 * (used for handling file uploads)
 * 
 * @return {Stream.Writable}
 */

module.exports = function newReceiverStream (options) {

	var receiver__ = Writable({objectMode: true});

	receiver__._write = function onFile (__newFile, encoding, next) {

		console.log(('Receiver: Received file `'+__newFile.filename+'` from an Upstream.').grey);

		// Default the output path for files to `/dev/null` for testing purposes.
		var outputPath = options.outputPath || '/dev/null';
		var outs = __newFile.pipe(require('fs').createWriteStream(outputPath));
		outs.on('finish', function () {
			console.log(('Receiver: Finished writing `'+__newFile.filename+'`').grey);
			next();
		});
		outs.on('error', function (err) {
			console.log(('Receiver: Error writing `'+__newFile.filename+'`:: '+ require('util').inspect(err)+' :: Cancelling upload and cleaning up already-written bytes...').red);
			//
			// TODO:
			// In a real receiver, this is where the already-written bytes
			// for this file would be garbage collected.
			// 
			next(err);
		});
	};
	
	return receiver__;
};
