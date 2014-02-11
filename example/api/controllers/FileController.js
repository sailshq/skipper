/**
 * FileController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {


	// Note: Because of the way the file parser works, the the file upload will not work
	// if the request stream closes before the process executes the call to the blob adapter above (`File.write`)
	// This is really only a problem for local testing, since the database calls before File.write will always
	// finish before the end of the request stream, since the request is sending lots of binary data 
	// Still, we should make sure and handle this case-- so... TODO (Mike): patch file-parser
	upload: function(req, res) {

		var PARAM_TO_INSPECT_FOR_FILES = 'hm';

		sails.log('Check out all these params!', req.params.all());

		var incomingFileStream = req.file(PARAM_TO_INSPECT_FOR_FILES);
		// var streamOfAllIncomingFiles = req.files;

		// Create File of type `binary`
		File.write(incomingFileStream, {

			// 25MB max upload at a time
			maxBytes: 25 * 1000 * 1000,

			// Optional map function for generating the name of the file when it is stored in the adapter
			// (nonsense-ified mutation of the original filename, i.e. `downloadName`)
			// saveAs: function (origFilename) { return 'newFilename.foo'; }

		}, function allUploadsComplete(err, files) {

			if (err) return res.serverError(err);
			if (!files || !_.keys(files).length) {
				return res.badRequest([{
					message: 'No files were uploaded to the `'+PARAM_TO_INSPECT_FOR_FILES+'` parameter.',
					files: files
				}]);
			}

			// Trying to get files from a field
			// which was not used to upload files
			// will return a NoopStream:
			// req.file('foobar');

			var kb = _.reduce(files, function (b, file) {
				return b+file.size;
			}, 0);
			kb /= 1000;
			sails.log('Sending response-- uploaded ~'+kb+'KB...');
			res.json({
				message: _.keys(files).length + ' files uploaded!',
				files: files
			});
		});
	}
};



/**
 * Example `generateBlobName` fn that adds a nonse
 * to both sides of the filename.
 *
 * @param {String} original filename
 * @returns {String} name to save the file as in the blob store
 */
function generateBlobName(filename) {
	var ext, name, filenameParts = filename.split(/(.+)\.([^.]+)$/);
	if (filenameParts.length < 3) {
		name = filename;
		ext = '';
	} else {
		name = filenameParts[1];
		ext = '.' + filenameParts[2];
	}
	return nonce() + name + nonce() + ext;
}