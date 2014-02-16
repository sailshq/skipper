/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, Uploader = require('./helpers/uploader')
	, _ = require('lodash')
	, util = require('util')
	, path = require('path')
	, assert = require('assert')
	, toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse')
	, fsx = require('fs-extra');


// Fixtures
var actionFixtures = {
	uploadAvatar: require('./fixtures/uploadAvatar.usingUploadMethod.action')
};


describe('req.file(...).upload(...) ::', function() {
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

		// Check that a file landed
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		assert(filesUploaded.length === 1);

		// Check that its contents are correct
		var uploadedFileContents = fsx.readFileSync(path.join(suite.outputDir.path, filesUploaded[0]));
		var srcFileContents = fsx.readFileSync(suite.srcFiles[0].path);
		assert( uploadedFileContents.toString() === srcFileContents.toString() );
	});

});
