/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
  , Uploader = require('./helpers/uploader')
  , _ = require('@sailshq/lodash')
  , util = require('util')
  , path = require('path')
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

      var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;

      req.file('avatar')
        .upload(newReceiverStream({
          id: OUTPUT_PATH
        }), function (err, files) {
          if (err) res.send(500, err);
          res.sendStatus(200);
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
    var smallFile = suite.srcFiles[0];
    var pathToSmallFile = smallFile.path;
    form.append('foo', 'hello');
    form.append('bar', 'there');
    form.append('emptyParam', '');
    form.append('avatar', fsx.createReadStream(pathToSmallFile));

  });

  it('should have been able to access the body parameters passed in the upload request', function () {
    assert(bodyParamsThatWereAccessible);
    assert(bodyParamsThatWereAccessible.foo);
    assert(bodyParamsThatWereAccessible.bar);
    assert.strictEqual(bodyParamsThatWereAccessible.emptyParam, '');
  });


  it('should have uploaded a file to `suite.outputDir`', function () {

    // Check that a file landed
    var filesUploaded = fsx.readdirSync(suite.outputDir.path);
    assert.equal(filesUploaded.length, 1);

    // Check that its contents are correct
    var uploadedFileContents = fsx.readFileSync(path.join(suite.outputDir.path, filesUploaded[0]));
    var srcFileContents = fsx.readFileSync(suite.srcFiles[0].path);
    assert( uploadedFileContents.toString() === srcFileContents.toString() );
  });

});
