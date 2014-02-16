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
 */
module.exports = function (req, res) {

	var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;
	var MAX_UPLOAD_SIZE_IN_BYTES = 5 * 1000 * 1000;

	var receiver__ = newReceiverStream({
		maxBytes: MAX_UPLOAD_SIZE_IN_BYTES,
		id: OUTPUT_PATH
	});
	
	req.file('avatar').upload(receiver__, function (err, files) {
		if (err) return res.send(500,err);
		return res.send(200);
	});
};
