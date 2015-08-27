/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle');
var Uploader = require('./helpers/uploader');
var _ = require('lodash');
var util = require('util');
var path = require('path');
var assert = require('assert');
var toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse');
var fsx = require('fs-extra');


// Fixtures
var actionFixtures = {
  uploadAvatar: require('./fixtures/uploadAvatar.action')
};


describe('req.file(...).upload() defaults to skipper-disk adapter when passed a string or `options` object ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);

  it('binds a file uploader action', function() {
    suite.app.post('/upload', function(req, res) {
      bodyParamsThatWereAccessible = _.cloneDeep(req.body);

      var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;

      req.file('avatar')
        .upload(OUTPUT_PATH, function(err, files) {
          if (err) {
            try {
              if (err instanceof Error) {
                return res.json(500, {
                  message: err.message,
                  name: err.name,
                  code: err.code,
                  status: err.status,
                  stack: err.stack
                });
              }
            } catch (e) {}
            return res.json(500, err);
          }
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
    var pathToSmallFile = suite.srcFiles[0].path;
    form.append('avatar', fsx.createReadStream(pathToSmallFile));

  });


  it('should have uploaded a file to `suite.outputDir`', function() {

    // Check that a file landed
    var filesUploaded = fsx.readdirSync(suite.outputDir.path);
    assert.equal(filesUploaded.length,1, 'Expected `filesUploaded.length` === 1, but after listing contents of "'+suite.outputDir.path+'", noticed there were '+filesUploaded.length+'\nHere is the complete list: \n'+util.inspect(filesUploaded, false, null));

    // Check that its contents are correct
    var uploadedFileContents = fsx.readFileSync(path.join(suite.outputDir.path, filesUploaded[0]));
    var srcFileContents = fsx.readFileSync(suite.srcFiles[0].path);
    assert(uploadedFileContents.toString() === srcFileContents.toString());
  });


});
