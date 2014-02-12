/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, Uploader = require('./helpers/uploader')
	, _ = require('lodash')
	, util = require('util')
	, assert = require('assert')
	, concat_in = require('concat-stream')
	, fsx = require('fs-extra');




describe('basic usage', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);

	it('sets up a file upload route', function () {
		suite.app.post('/upload', function (req, res) {
			// req.file();
			res.send('ok!');
		});
	});



	it('sends a multi-part file upload request', function(done) {		
		
		// Builds an HTTP request
		var httpRequest_out = Uploader({
			baseurl: 'http://localhost:3000'
		}, function onResponse (err, res, body) {
			if (err) return done(err);
			if (res.statusCode >= 300) {
				return done(new Error(util.format('Server responded with %s :: %s', res.statusCode, util.inspect(body))));
			}
			done();
		});

		// Attaches a multi-part form upload to the HTTP request:
		var form = httpRequest_out.form();
		var pathToSmallFile = suite.srcFiles[0].path;
		form.append('320x480', fsx.createReadStream(pathToSmallFile));

	});



	it('should have uploaded a file to `suite.outputDir`', function () {
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		assert(filesUploaded.length === 1);
	});

});
