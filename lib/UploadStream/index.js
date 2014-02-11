/**
 * UploadStream
 *
 * A stream of signal events, where each signal event contains
 * a paused multipart "fileStream" from Formidable.
 *
 * Examples of uploadstreams:
 * + req.file('foo')
 * + req.files
 * + req.file('bar')
 *
 * NOTE: UploadStreams are paused upon instantiation!
 * (resume with `instance.resume()`)
 * Resumed automatically by any compatible streaming
 * binary adapter in Sails.
 *
 * This can be made more versatile in the future.
 * Currently, it is using a custom pause/resume implementation
 * because formidable is not compatible with the latest Node streams
 * implementation.
 *
 * @implements Writable
 * @implements Resumable
 * @extends {Stream}
 */

module.exports = function(options) {

	var UploadStream = require('./constructor')(options);
	
	UploadStream.prototype.write = require('./write');

	UploadStream.prototype.end = require('./end');

	UploadStream.prototype.enforceMaxBytes = require('./enforceMaxBytes');


	/**
	 * `this.onFileData()` is called just before new bytes are written
	 * after built-in binary transformations and constraints
	 * to the underlying adapter's write stream.
	 *
	 * This allows us to get in the middle and enforce constraints, transform the data,
	 * and mixin business logic (but only synchronously)
	 */

	UploadStream.prototype.onFileData = function(newBytes, fileStream) {
		// override me
	};


	/**
	 * Enforce per-file upload size limit
	 */

	UploadStream.prototype.enforceMaxBytesPerFile = function(bytesWrittenOfFile) {
		// TODO
		return true;
	};


	/**
	 * Expose stream constructor
	 */
	
	return UploadStream;



	// TODO: 
	// implement something like this: (or just use it, if possible)
	// + https://npmjs.org/package/lazystream
	// + https://github.com/jpommerening/node-lazystream
	// 
	// To deal with `too many open files` issues that are likely
	// to come up in certain production use cases.
	// 
	// See: https://github.com/senchalabs/connect/issues/898

};
