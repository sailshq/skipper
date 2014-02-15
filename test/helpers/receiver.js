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




			console.log('WRITING NEW FILE to receiver!');

			// Should we track the files received..?
			// Or can we always manage things this way?
			// (I think the latter)

			__newFile.once('error', function(err) {
				console.error('Error on file `'+__newFile.filename+'`::', err);

				// This is where bytes already written would be cleaned up.
				// (if this was a real receiver)
				next(err);
			});
			__newFile.once('finish', function () {
				next();
			});

			__newFile.pipe(require('fs').createWriteStream('/dev/null'));

			// Read from newFile until it's all done
			// __newFile.on('readable', function onPump () {

			// 	var buffer = __newFile.read();
			// 	console.log('the file `'+__newFile.filename+'` pumped at us:', buffer);

			// 	// Got new bytes
			// 	if (buffer) {
			// 		// TODO: actually write `newFile` somewhere
			// 		return next();
			// 	}

			// 	// Otherwise we're done (all bytes have been read)
			// 	return next();
			// });


		};



		return receiver__;
	}
};
