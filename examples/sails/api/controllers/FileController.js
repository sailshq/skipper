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
		sails.log('Request reached the controller.  `req.body` ===', req.body);

		var PARAM_TO_INSPECT_FOR_FILES = 'hm';
		var uploadStream = req.file(PARAM_TO_INSPECT_FOR_FILES);

		// Create File of type `binary`
		var stream = File.write(uploadStream, {

			// Cumulative bytes allowed per request on this uploadstream
			maxBytes: 20 * 1000 * 1000 * 1000,

			// Optional map function for generating the name of the file when it is stored in the adapter
			// (nonsense-ified mutation of the original filename, i.e. `downloadName`)
			// saveAs: function (origFilename) { return 'newFilename.foo'; }

		}, function allUploadsComplete(err, files) {

			if (!err && typeof files === 'object') {
				sails.log(
					require('util').format(
						'File adapter triggered callback with %s and %s.',
						Object.keys(files).length + ' files',
						err ? 'an error: '+err : 'no error.'
					)
				);
			}
			else {
				sails.log.error(
					require('util').format(
						'File adapter triggered callback with an error: '+err
					)
				);
				return res.serverError(err);
			}

			var megabytes = _.reduce(files, function (b, file) {
				return b+file.size;
			}, 0);
			megabytes /= 1000000;
			sails.log('Uploaded ~'+megabytes+' MB across '+Object.keys(files).length+' different files...');

			console.log();
			console.log();
			console.log();
			sails.log('Now waiting for 2000ms on purpose...');

			setTimeout(function waitAWhileToBeEvenMoreOrnery () {
				if (err) return res.serverError(err);

				if (!files || !_.keys(files).length) {
					return res.badRequest([{
						message: 'No files were uploaded to the `'+PARAM_TO_INSPECT_FOR_FILES+'` parameter.',
						files: files
					}]);
				}

				sails.log('Done!');
				res.json({
					message: _.keys(files).length + ' files uploaded!',
					files: files
				});

			}, 2000);

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
