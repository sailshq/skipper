/**
 * Module dependencies
 */

var Receiver = require('../../../diskReceiver');




/**
 * FileController.js
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {


	// NOTE:
	// This example demonstrates skipper (aka file-parser) in its
	// completely raw usage.  When the receiver implementation is complete,
	// this will become much simpler.
	upload: function(req, res) {

		req.file('avatar').upload( Receiver() , function (err, files) {
			if (err) return res.serverError(err);
		
			res.json({
				message: files.length + ' file(s) uploaded successfully!',
				files: files
			});

		});

	}
};
