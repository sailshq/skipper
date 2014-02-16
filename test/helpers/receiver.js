var log = require('../../lib/logger');

module.exports = {


	/**
	 * Build a mock readable stream that emits incoming files.
	 * (used for file downloads)
	 * 
	 * @return {Stream.Readable}
	 */
	newEmitterStream: function newEmitterStream () {
		// TODO: 
	},



	/**
	 * Build a mock writable stream that handles incoming files.
	 * (used for file uploads)
	 * 
	 * @return {Stream.Writable}
	 */
	
	newReceiverStream: function newReceiverStream (options) {

		// Keep track of files we've written
		var files = [];

		var Writable = require('stream').Writable;
		var receiver__ = Writable({objectMode: true});

		receiver__._write = function onFile (__newFile, encoding, next) {

			log(('Receiver: Received file `'+__newFile.filename+'` from an Upstream.').grey);


			// TODO:
			// 
			// This should probably be deprecated now that this is taken care of
			// inside of the Upstream class:
			// (leaving it commented-out here for posterity, and in case we realize we want it back)
			// 
			// // Listen for errors on the incoming side of this file stream
			// // (i.e. if the user cancelled the upload)
			// __newFile.on('error', function (err) {
			// 	log(('Receiver: Error on incoming stream received for `'+__newFile.filename+'`::'+require('util').inspect(err)+' :: Cancelling upload and cleaning up already-written bytes...').red);
			// 	//
			// 	// TODO:
			// 	// In a real receiver, this is where the already-written bytes
			// 	// for this file would be garbage collected.
			// 	// 
			// });

			// Default the output path for files to `/dev/null` for testing purposes.
			var outputPath = options.outputPath || '/dev/null';
			var outs = __newFile.pipe(require('fs').createWriteStream(outputPath));
			outs.on('finish', function () {
				log(('Receiver: Finished writing `'+__newFile.filename+'`').grey);
				next();
			});
			outs.on('error', function (err) {
				log(('Receiver: Error writing `'+__newFile.filename+'`:: '+ require('util').inspect(err)+' :: Cancelling upload and cleaning up already-written bytes...').red);
				//
				// TODO:
				// In a real receiver, this is where the already-written bytes
				// for this file would be garbage collected.
				// 
				next(err);
			});
		};
		
		return receiver__;
	}
};
