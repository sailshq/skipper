/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, Uploader = require('./helpers/uploader')
	, _ = require('lodash')
	, util = require('util')
	, assert = require('assert')
	, toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse')
	, newReceiverStream = require('./helpers/receiver').newReceiverStream
	, fsx = require('fs-extra');


// Fixtures
var actionFixtures = {
	uploadAvatar: function (req, res) {
		req.file('avatar')
		.upload(newReceiverStream(), function (err, files) {
			if (err) res.send(500, err);
			res.send(200);
		});
	}
};


describe('basic usage', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);



	it('bind a file uploader action', function () {
		suite.app.post('/upload', actionFixtures.uploadAvatar);
	});



	it('sends a multi-part file upload request', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			baseurl: 'http://localhost:3000'
		}, toValidateTheHTTPResponse(done));

		// Attaches a multi-part form upload to the HTTP request.,
		var form = httpRequest.form();
		var pathToSmallFile = suite.srcFiles[0].path;
		form.append('avatar', fsx.createReadStream(pathToSmallFile));

	});



	it('should have uploaded a file to `suite.outputDir`', function () {
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		// assert(filesUploaded.length === 1);
	});

});
