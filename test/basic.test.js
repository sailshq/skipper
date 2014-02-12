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



	it('bind a file uploader action', function () {
		suite.app.post('/upload', actionFixtures.uploadAvatar);
	});



	it('sends a multi-part file upload request', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			baseurl: 'http://localhost:3000'
		}, toValidateTheHTTPResponse(done));

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






/**
 * toValidateTheHTTPResponse
 * 
 * @param  {Function} done [description]
 * @return {Function} callback for HTTP request- checks that response is ok
 */

function toValidateTheHTTPResponse (done) {
	return function validateHTTPResponse (err, res, body) {
		if (err) return done(err);
		if (res.statusCode >= 300) {
			return done(new Error(util.format('Server responded with %s :: %s', res.statusCode, body)));
		}
		done();
	};
}

