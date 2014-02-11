

/**
 * Enforce maxBytes for this UploadStream.
 * (max number of bytes allowed in a single request on this particular UploadStream.)
 * Useful for enforcing global file upload limits or directory/user-specific quotas.
 * 
 * @param  {[type]} totalBytesWritten [description]
 * @param  {[type]} fileStream        [description]
 * @return {[type]}                   [description]
 */
module.exports = function enforceMaxBytes (totalBytesWritten, fileStream) {

	// Enforce combined file upload limit
	if (totalBytesWritten <= this.maxBytes) {
		return true;
	}

	// log('Enforcing ' + this.maxBytes + 'B upload limit..!  Quota exceeded!');

	// Build error object
	var bytesExceeded = totalBytesWritten - this.maxBytes;
	var quotaExceededError = {
		status: 'Forbidden',
		message: 'Quota exceeded :: ' + (totalBytesWritten/1000) + 'kB upload exceeds `maxBytes` (' + (this.maxBytes/1000) + 'kB) by at least ' + (bytesExceeded/1000) + 'kB.  Upload cancelled.',
		totalBytesWritten: totalBytesWritten,
		maxBytes: this.maxBytes,
		bytesExceeded: bytesExceeded
	};

	// log(this.maxBytes + 'B upload limit exceeded for ' +
	// 	(this.fieldName ? '`req.file("'+this.fieldName+'")`' : '`req.files`')+
	// 	'!');

	// Trigger the `end` of the upload stream, so that no more files show up,
	// passing along a descriptive error argument
	console.log('AHAHHHHH QUOTA EXCEEDED',quotaExceededError);
	this.end(quotaExceededError);



	// This DOES NOT, however, trigger the end of the current field/part stream.
	// But is that even what we want to do?  Yes, and here's why:
	// If a `maxBytes` constraint is validated, the underlying
	// read stream (usually a HTTP request) will be ended.
	// This is so no more bytes will show up for this file upload, which is good.
	// That said, it will stop the stream, meaning that any other instance of UploadStream
	// depending on that fileStream will no longer be able to read from the stream.
	//
	// For example:
	// Let's say we're listening through `req.files` to a file upload sent with the form-data
	// field name "foo".  If the file violates a constraint, it will be rejected not only
	// on `req.files`, but also on `req.file('foo')`

	// This line prevents incoming data events for the fileStream
	// from continuing to write to this, OR ANY, upload stream.
	fileStream.removeAllListeners('data');


	// Now we've prevented more incoming data from hitting us, and we know that this stream
	// is essentially dead.  If this is the universal stream, do nothing.
	// TODO: do something smarter and make the universal stream still work.
	if ( !fileStream.fieldName ) {
		var doSomethingSmarter;
		// log('Universal file upload stream was halted because it exceeded `maxBytes`.');
	}

	// If this is the stream for a specific file listener, subtract the bytes of the
	// stream from the totalBytesWritten that we're tracking.  Since that will be garbage-collected
	// anyway, this allows us to ignore the big file and continue to upload other files, since we may
	// still be able to upload them without exceeding maxBytes.
	else {
		var doSomethingElseSmarter;
		// log('File upload stream for ' + fileStream.fieldName + ' was halted because `maxBytes` was exceeded.');
	}

	return false;
};
