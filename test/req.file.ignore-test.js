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
	uploadAvatar: require('./fixtures/uploadAvatar.action'),
	send200: require('./fixtures/send200.action')
};


describe('Ignoring :: req.file("foo"), when a file upload is sent to the "bar" field ::', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);



	it('binds a file uploader action', function () {
		suite.app.post('/upload', actionFixtures.uploadAvatar);
	});



	it('sends an attachment on an unused field', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			baseurl: 'http://localhost:3000'
		}, toValidateTheHTTPResponse(done));

		// Attaches a multi-part form upload to the HTTP request.,
		var form = httpRequest.form();
		var pathToSmallFile = suite.srcFiles[1].path;
		form.append('something_we_dont_care_about', fsx.createReadStream(pathToSmallFile));

	});

	it('should NOT have uploaded the file to `suite.outputDir`', function () {

		// Check that nothing was uploaded
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		assert(filesUploaded.length === 0);
	});



	it('binds an action which does not do anything w/ ANY of the incoming Upstreams', function () {
		suite.app.post('/noop', actionFixtures.send200);
	});

	it('sends an attachment on an unused field', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			url: 'http://localhost:3000/noop'
		}, toValidateTheHTTPResponse(done));

		// Attaches a few files to the HTTP request.,
		var form = httpRequest.form();
		var pathToSmallFile = suite.srcFiles[1].path;
		form.append('something_we_dont_care_about', fsx.createReadStream(pathToSmallFile));
		form.append('something_we_dont_care_about', fsx.createReadStream(pathToSmallFile));
		form.append('foo', fsx.createReadStream(pathToSmallFile));
		form.append('bar', fsx.createReadStream(pathToSmallFile));

	});

	it('should NOT have uploaded the file to `suite.outputDir`', function () {

		// Check that nothing was uploaded
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		assert(filesUploaded.length === 0);
	});

});
