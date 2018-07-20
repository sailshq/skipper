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
  , fsx = require('fs-extra')
  , async = require('async')
  , uuid = require('uuid/v4');


// Fixtures
var actionFixtures = {
  uploadAvatar: require('./fixtures/uploadAvatar.action')
};


describe('Sucessive file uploads should not fail ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);

  it('binds a file uploader action', function () {
    suite.app.post('/upload', function (req, res) {
      bodyParamsThatWereAccessible = _.cloneDeep(req.body);

      req.file('avatar')
        .upload({
          maxBytes: 150000000, // 150MB
          dirname: req.__FILE_PARSER_TESTS__OUTPUT_PATH,
          saveAs: uuid()+'.jpg'
        }, function (err, files) {
          if (err) res.send(500, err);
          res.sendStatus(200);
        });
    });
  });


  it('sends 6 multi-part file upload requests', function(done) {

      async.parallel([
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        },
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        },
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        },
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        },
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        },
        function(cb){
          // Builds an HTTP request
          var httpRequest = Uploader({
            baseurl: 'http://localhost:3000'
          }, toValidateTheHTTPResponse(function(){
            cb(null, "derp");
          }));

          // Attaches a multi-part form upload to the HTTP request.,
          var form = httpRequest.form();
          var pathToSmallFile = suite.bigSrcFiles[0].path;
          form.append('avatar', fsx.createReadStream(pathToSmallFile));
        }
      ], function(err, result){
        done(err);
      });

  });


  it('should have uploaded a 6 files to `suite.outputDir`', function () {

    // Check that a file landed
    var filesUploaded = fsx.readdirSync(suite.outputDir.path);
    // console.log('CHECKING IN ',suite.outputDir.path);
    assert.equal(filesUploaded.length, 6);

    for(var i = 0; i < 6; i++){
      // Check that its contents are correct
      var uploadedFileContents = fsx.readFileSync(path.join(suite.outputDir.path, filesUploaded[i]));
      var srcFileContents = fsx.readFileSync(suite.bigSrcFiles[0].path);
      assert(uploadedFileContents.toString() === srcFileContents.toString());
    }
  });

});
