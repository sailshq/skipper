/**
 * Module dependencies
 */

var _ = require('lodash');



module.exports = function ( parentUploadStream, fileStream ) {

	var throttledLog = _.throttle(function logStuff (msg) {
		console.log(msg);
	}, 25);


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

		// Track bytes uploaded on the actual file stream itself.
		fileStream._fileparser_size = fileStream._fileparser_size || 0;
		fileStream._fileparser_size += newBytes.length;

		// throttledLog(
		// console.log(
		// 	'UploadStream (`'+parentUploadStream.fieldName+'`) received '+newBytes.length+'B of data '+
		// 	'from file: `'+fileRecord.filename+'`  '+
		// 	'Total received so far: '+((parentUploadStream._bytesWritten+newBytes.length)/1000000)+'MB'
		// );

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
