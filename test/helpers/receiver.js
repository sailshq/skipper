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
	
	newReceiverStream: function newReceiverStream () {

		// Keep track of files we've written
		var files = [];

		var Writable = require('stream').Writable;
		var receiver__ = Writable({objectMode: true});

		receiver__._write = function(newFile, enc, next) {
			
			// TODO: actually write `newFile` somewhere
			setTimeout(function () {
				next();
			}, 250);
		};

		return receiver__;
	}
};
