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

			console.log('Receiver: Received file `'+__newFile.filename+'` from an Upstream.');

			var outs = __newFile.pipe(require('fs').createWriteStream('/dev/null'));
			outs.on('finish', function () {
				console.log('Receiver: Finished writing `'+__newFile.filename+'`');
				next();
			});
			outs.on('error', function (err) {
				console.error('Receiver: Error writing `'+__newFile.filename+'`::', err);
				next(err);
			});
		};
		
		return receiver__;
	}
};
