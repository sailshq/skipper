/**
 * Module dependencies
 */

var _ = require('lodash');



/**
 * Notify listeners on this UploadStream that the upload
 * is complete.
 */

module.exports = function end(err) {

	// Mark this stream as ended so that the code below is run once, at most.
	if (this._ended) return;
	this._ended = true;

	// require('colors');
	// console.log('ENDING UPLOAD STREAM ('+this.fieldName+')' + (err ? (' WITH ERROR:'.red)+err : ''));

	// Cancel maxBufferTimer
	clearTimeout(this.maxBufferTimer);

	// Unsubscribe to data events on all fileStreams.
	_.each(this.fileStreams, function (stream) {
		stream.removeAllListeners('data');
	});

	// Emit 'end' event, sending this uploadStream's `err` as an arg
	// if it exists.
	this.emit('end', err);
};
