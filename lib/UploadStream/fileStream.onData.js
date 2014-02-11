
module.exports = function ( parentUploadStream, fileStream ) {



	/**
	 * Receive a new chunk of binary data from a fileStream.
	 * 
	 * @param  {[type]} newBytes [description]
	 * @return {[type]}          [description]
	 */

	return function onData (newBytes) {

		// Calculate the total # of bytes written on this FileStream 
		// within its parent UploadStream.
		// (necessary for enforcing per-file upload limits on filesize)
		var fileRecord = parentUploadStream.files[fileStream._id];
		fileRecord.size += newBytes.length;

		// console.log(fileRecord.filename + ' :: writing-- size is now::::::  ', fileRecord.size);

		// Increment the total # of bytes written 
		// across ALL of the FileStreams in this UploadStream
		parentUploadStream._bytesWritten += newBytes.length;

		// Whenever a new update comes in, check that upload limit
		// constraints are not violated- if they are, break the stream
		var valid = true;
		valid = valid && parentUploadStream.enforceMaxBytes(parentUploadStream._bytesWritten, this);
		valid = valid && parentUploadStream.enforceMaxBytesPerFile(fileRecord.size, this);

		// // If invalid, bail out now so we don't write anything.
		// if (!valid) return;

		// TODO: streaming encryption (crypto streams? http://nodejs.org/api/crypto.html)
		// TODO: also streaming compression? (zlib? http://nodejs.org/api/zlib.html)
		// TODO: progress update event fired?
		// TODO: thumbnail generation? (imagemagick) -> adds new filestreams to uploadstream

		// Pass new data buffer to be written (`newBytes`)
		// as well the file stream, to the overridable `onFileData` fn
		parentUploadStream.onFileData(newBytes, fileStream);
	};

};
