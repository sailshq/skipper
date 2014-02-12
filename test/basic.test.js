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


// Fixtures
var actionFixtures = {
	uploadAvatar: require('./fixtures/uploadAvatar.action')
};


describe('basic usage', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);



	it('bind a file upload action', function () {

		suite.app.post('/upload', actionFixtures.uploadAvatar);
	});



	it('sends a multi-part file upload request', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			baseurl: 'http://localhost:3000'
		}, function onResponse (err, res, body) {
			if (err) return done(err);
			if (res.statusCode >= 300) {
				return done(new Error(util.format('Server responded with %s :: %s', res.statusCode, body)));
			}
			done();
		});

		// Attaches a multi-part form upload to the HTTP request:
		var form = httpRequest.form();
		var pathToSmallFile = suite.srcFiles[0].path;
		form.append('avatar', fsx.createReadStream(pathToSmallFile));

	});



	it('should have uploaded a file to `suite.outputDir`', function () {
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		assert(filesUploaded.length === 1);
	});

});

