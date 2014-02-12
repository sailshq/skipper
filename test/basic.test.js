/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, Uploader = require('./helpers/uploader')
	, _ = require('lodash')
	, assert = require('assert')
	, concat_in = require('concat-stream')
	, fsx = require('fs-extra');




describe('basic usage', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);

	it('sets up a route', function () {
		suite.app.post('/upload', function (req, res) {
			res.send('ok!');
		});
	});

	it('uploads a file', function(done) {		
		var pathToSmallFile = suite.srcFiles[0].path;

		// and a multipart upload request.
		var httpRequest_out = Uploader({ baseurl: 'http://localhost:3000' }, onResponse);
		var form = httpRequest_out.form();
		form.append('320x480', fsx.createReadStream(pathToSmallFile));
		function onResponse (err, res, body) {
			var info = {
				status: res.statusCode,
				headers: res.headers,
				responseText: err ? err : body
			};

			if (err) console.error(info);
			console.log(info);

			done(err);
		}
	});

	it('should have uploaded a file to `suite.outputDir`', function () {
		var contents = fsx.readdirSync(suite.outputDir.path);
		console.log(contents);
	});

});