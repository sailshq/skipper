

/**
 * Sails/Express action to handle multipart file uploads
 * sent in the `avatar` field.
 *
 * @param  {Request} req
 * @param  {Response} res
 */

module.exports = function (req, res) {

	var outgoingFiles__ = buildTransportStream();

	req.file('avatar').pipe( outgoingFiles__ );

	outgoingFiles__.on('finish', function allFilesUploaded () {
		res.send(200);
	});
	outgoingFiles__.on('error', function unableToUpload (err) {
		res.send(500, err);
	});

};




/**
 * Build a simple writable stream that handles incoming files.
 *
 * 
 * @return {Stream.Writable}
 */
 
function buildTransportStream () {
	var Transform = require('stream').Transform;
	var outgoingFiles__ = Transform({objectMode: true});

	outgoingFiles__._write = function(newFile, enc, next) {
		
		// TODO: actually write `newFile` somewhere
		setTimeout(function () {
			console.log('Got new file!');
			next();
		}, 250);
	};

	return outgoingFiles__;
}
