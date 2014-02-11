/**
 * Module dependencies
 */




/**
 * Signal the start of a new file upload
 *
 * @emits {Stream} fileStream
 *			binary stream of data for the file, paused
 *			until `fileStream._resume()` is called
 */

module.exports = function write (fileStream) {

	var uploadStream = this;

	// Keep track of files which have been sent through this fileStream
	// and reset the file's upload metadata
	// (e.g. zero out bytesWritten counter for newly detected file)
	this.files[fileStream._id] = {
		field: fileStream.fieldName,
		filename: fileStream.filename,
		size: 0,
		mime: fileStream.mime,
		headers: fileStream.headers,
		transferEncoding: fileStream.transferEncoding,
		_id: fileStream._id
	};

	// Save ref to stream
	this.fileStreams[fileStream._id] = fileStream;

	// log.verbose('UploadStream.write() ::', fileStream.filename);

	// Listen for chunks coming down the field stream
	// and run this.interrupt
	fileStream.on('data', function receiveBinaryData(newBytes) {

		var logmsg = '';
		if (!uploadStream.fieldName &&
			uploadStream.fieldName !== 0 &&
			uploadStream.fieldName !== '') {
			logmsg += 'Unified (multi-upload) stream :: ';
		} else logmsg += 'Field stream :: "' + uploadStream.fieldName + '" ';
		// log.verbose(logmsg + 'received ' + newBytes.length + 'B chunk of "' + this.filename + '"...');

		// Calculate the total # of bytes written on this FileStream 
		// within this UploadStream
		// (necessary for enforcing per-file upload limits on filesize)
		var fileRecord = uploadStream.files[fileStream._id];
		// console.log(fileRecord.filename + ' :: writing-- size is now::::::  ', fileRecord.size);
		fileRecord.size += newBytes.length;

		// Increment the total # of bytes written 
		// across ALL of the FileStreams in this UploadStream
		uploadStream._bytesWritten += newBytes.length;

		// Whenever a new update comes in, check that upload limit
		// constraints are not violated- if they are, break the stream
		var valid = true;
		valid = valid && uploadStream.enforceMaxBytes(uploadStream._bytesWritten, this);
		valid = valid && uploadStream.enforceMaxBytesPerFile(fileRecord.size, this);

		// // If invalid, bail out now so we don't write anything.
		// if (!valid) return;

		// TODO: streaming encryption (crypto streams? http://nodejs.org/api/crypto.html)
		// TODO: also streaming compression? (zlib? http://nodejs.org/api/zlib.html)
		// TODO: progress update event fired?
		// TODO: thumbnail generation? (imagemagick) -> adds new filestreams to uploadstream

		// Pass new data buffer to be written (`newBytes`)
		// as well the file stream, to the overridable `onFileData` fn
		uploadStream.onFileData(newBytes, fileStream);
	});


	// Unsubscribe from all data events when the stream ends.
	fileStream.on('end', function () {
		fileStream.removeAllListeners('data');
	});


	// Emit paused field stream (from MPU) on upload stream
	this.emit('data', fileStream);
};