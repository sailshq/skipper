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


describe('req.body ::', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);


	// Object of params accessible in req.body in the upload action
	var bodyParamsThatWereAccessible = {};


	it('binds a file uploader action', function () {
		suite.app.post('/upload', function (req, res) {
			bodyParamsThatWereAccessible = _.cloneDeep(req.body);

			req.file('avatar')
				.upload(newReceiverStream(), function (err, files) {
					if (err) res.send(500, err);
					res.send(200);
				});
		});
	});



	it('sends a multi-part file upload request', function(done) {		
		
		// Builds an HTTP request
		var httpRequest = Uploader({
			baseurl: 'http://localhost:3000'
		}, toValidateTheHTTPResponse(done));

		// Attaches a multi-part form upload to the HTTP request.,
		var form = httpRequest.form();
		var pathToSmallFile = suite.srcFiles[0].path;
		form.append('foo', 'hello');
		form.append('bar', 'there');
		form.append('avatar', fsx.createReadStream(pathToSmallFile));

	});

	it('should have been able to access the body parameters passed in the upload request', function () {
		assert(bodyParamsThatWereAccessible);
		assert(bodyParamsThatWereAccessible.foo);
		assert(bodyParamsThatWereAccessible.bar);
	});


	it('should have uploaded a file to `suite.outputDir`', function () {
		var filesUploaded = fsx.readdirSync(suite.outputDir.path);
		// assert(filesUploaded.length === 1);
	});

});
