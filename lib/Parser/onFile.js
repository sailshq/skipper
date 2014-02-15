
/**
 * Receive a file.
 * @param  {stream.Readable} part			[a file from one of the fields in the multipart upload]
 */
module.exports = function ( part ) {

	// First time a file is received, emit an event
	// and set a flag (`this._hasReceivedFirstFile`)
	if ( !this.hasReceivedFirstFile ) {
		this.emit('firstFile');
		this._hasReceivedFirstFile = true;
	}

	// Acquire Upstream for this field
	// (one may or may not already exist)
	var up = this.acquireUpstream(part.name);

	// Inform Upstream about new file
	up.writeFile(part);
};