/**
 * Module dependencies
 */

var _ = require('lodash');



/**
 * Notify listeners on this UploadStream that the upload
 * is complete.
 */

module.exports = function end(err) {
	// log();
	// log(' * `end()` was called on an UploadStream ::');
	// if (this.fieldName) log('     '+this.fieldName);
	// if (err) log('     ERROR:',err);
	// log('     files :: '+_.pluck(this.files, 'filename') );
	// log('     bytes received :: '+this._bytesWritten);

	// console.log('ENDING UPLOAD STREAM ('+this.fieldName+')' + (err ? ' WITH ERROR:'+err : ''));

	// Cancel maxBufferTimer
	clearTimeout(this.maxBufferTimer);

	// Unsubscribe to data events on all fileStreams.
	_.each(this.fileStreams, function (stream) {
		stream.removeAllListeners('data');
	});

	// Emit 'end' event, setting this uploadStream's fatalError
	// as an argument if it exists.
	this.emit('end', err);
};
