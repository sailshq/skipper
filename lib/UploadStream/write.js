/**
 * Module dependencies
 */

var receiveBinaryData = require('./fileStream.onData');





/**
 * Signal the detection of a new file on this UploadStream.
 *
 * @emits {Stream} newFileStream
 *			A pseudo-"paused" binary stream of data for a newly detected file.
 *
 * @context {UploadStream}
 */

module.exports = function write ( newFileStream ) {

	var self = this;

	// Keep track of files which have been sent through this fileStream
	// and reset the file's upload metadata
	// (e.g. zero out bytesWritten counter for newly detected file)
	this.files[newFileStream._id] = {
		field: newFileStream.fieldName,
		filename: newFileStream.filename,
		size: 0,
		mime: newFileStream.mime,
		headers: newFileStream.headers,
		transferEncoding: newFileStream.transferEncoding,
		_id: newFileStream._id
	};

	// Other save a reference to the fileStream for later.
	this.fileStreams[newFileStream._id] = newFileStream;

	// Bind an event to the new FileStream:
	// Listen for new chunks of data coming down the newFileStream.
	// Run this interrupt function every time a new chunk of data
	// comes in.
	newFileStream.on('data', receiveBinaryData(this, newFileStream));


	// Bind an event to the new FileStream:
	// When the FileStream ends, unsubscribe this UploadStream
	// from all of the FileStream's future data events.
	newFileStream.on('end', function () {
		newFileStream.removeAllListeners('data');
	});




	// This UploadStream now emits an event letting
	// any listeners know that a new file has been detected
	// in the field(s) it is watching in the incoming MPU request.
	// 
	// It is important to note that this binary fileStream is still paused
	// (i.e. buffering to memory) and will need to be resumed before it
	// can be used.
	// 
	// IMPORTANT:
	// This is not the "pause" you might be used to from other Node streams--
	// since Formidable doesn't support modern streams, we're using a wrapper.
	// (see `../resumable` for details on that)
	// 
	this.emit('data', newFileStream);
};
