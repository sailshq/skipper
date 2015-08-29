/**
 * Module dependencies
 */

var newReceiverStream = require('../helpers/receiver').newReceiverStream;




/**
 * Sails/Express action to handle multipart file uploads
 * sent in the `avatar` field.
 *
 * @param  {Request} req
 * @param  {Response} res
 *
 *
 * NOTE:
 * Alternatively, you can use the more succinct `upload`
 * syntax, which you is chainable on `req.file(...)`.
 *
 * See the `uploadAvatar.usingUploadMethod.action.js` fixture.
 */

module.exports = function (req, res) {

	var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;
	var MAX_UPLOAD_SIZE_IN_BYTES = 5 * 1000 * 1000;


	var receiver__ = newReceiverStream({
		maxBytes: MAX_UPLOAD_SIZE_IN_BYTES,
		id: OUTPUT_PATH
	});

	req.file('avatar').pipe( receiver__ );

	receiver__.on('finish', function allFilesUploaded (files) {
		res.sendStatus(200);
	});
	receiver__.on('error', function unableToUpload (err) {
		res.send(500, err);
	});

};
