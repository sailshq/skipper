/**
 * Module dependencies
 */

var fsx = require('fs-extra');
var log = require('./logger');


module.exports = {


	/**
	 * Build a mock writable stream that handles incoming files.
	 * (used for file uploads)
	 *
	 * @return {Stream.Writable}
	 */

	newReceiverStream: function newReceiverStream (options) {

		var Writable = require('stream').Writable;
		var receiver__ = Writable({objectMode: true});

		receiver__._write = function onFile (__newFile, encoding, next) {

			log('Receiver: Received file `'+__newFile.filename+'` from an Upstream.');

			var outs = blobAdapter.touch({id: options.id});
			outs.on('finish', function () {
				log('Receiver: Finished writing `'+__newFile.filename+'`');
				next();
			});
			outs.on('error', function (err) {
				log(('Receiver: Error writing `'+__newFile.filename+'`:: '+ require('util').inspect(err)+' :: Cancelling upload and cleaning up already-written bytes...'));

				// Garbage-collects the already-written bytes for this file.
				blobAdapter.rm({id: options.id}, function (rmErr) {
					// If the file could not be garbage-collected, concatenate a final error
					// before calling `next()`
					if (rmErr) return next([err].concat([rmErr]));
					return next(err);
				});
			});
			__newFile.pipe(outs);
		};

		return receiver__;
	}
};


var blobAdapter = {


	touch: function (options) {
		// Default the output path for files to `/dev/null` for testing purposes.
		var id = options.id;
		var filePath = options.id || '/dev/null';

		return fsx.createWriteStream(filePath);
	},

	read: function (options) {
		var id = options.id;
		var filePath = id;

		return fsx.createReadStream(filePath, 'utf8');
	},

	rm: function (options, cb) {
		var id = options.id;
		var filePath = options.id || '/dev/null';

		fsx.remove(filePath, function (err) {
			if (err) {
				return cb(err);
			}
			return cb();
		});
	}
};
