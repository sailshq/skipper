// This test is issue #11
// (See https://github.com/balderdashy/skipper/issues/11 for details)
//
//
// Example form data:
//
// <form enctype="multipart/form-data" method="post">
//     <select multiple="multiple" name="options[]">
//         <option value="o1">Option 1</option>
//         <option value="o2">Option 2</option>
//         <option value="o3">Option 3</option>
//     </select>
//     <input type="file" name="upload" />
//     <input type="submit" value="Submit" />
// </form>

/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var assert = require('assert');
var _ = require('@sailshq/lodash');
var fsx = require('fs-extra');
var Lifecycle = require('./helpers/lifecycle');
var Uploader = require('./helpers/uploader');
var toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse');
var newReceiverStream = require('./helpers/receiver').newReceiverStream;


// Fixtures
var actionFixtures = {
  uploadAvatar: require('./fixtures/uploadAvatar.usingUploadMethod.action')
};


describe('multiple params ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);


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

    // Attaches multiple parameters with the same name (`options[]`)
    form.append('options[]', 'hello');
    form.append('options[]', 'there');

    // Attaches a file
    var pathToSmallFile = suite.srcFiles[0].path;
    form.append('avatar', fsx.createReadStream(pathToSmallFile));
  });

  it('should have been able to access ALL of the body parameters passed in the upload request', function () {
    assert(bodyParamsThatWereAccessible);
    assert(bodyParamsThatWereAccessible['options[]']);
    assert(_.isArray(bodyParamsThatWereAccessible['options[]']), util.format('`options[]` param should be an array- intead it was === %s', bodyParamsThatWereAccessible['options[]']));
    assert.equal(bodyParamsThatWereAccessible['options[]'].length, 2);
    assert.equal(bodyParamsThatWereAccessible['options[]'][0], 'hello');
    assert.equal(bodyParamsThatWereAccessible['options[]'][1], 'there');
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
