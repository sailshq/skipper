/**
 * Module dependencies
 */

var path = require('path');
var http = require('http');
var crypto = require('crypto');
var _ = require('lodash');
var fsx = require('fs-extra');
var Express = require('express');
var tmp = require('temporary');

var Skipper = require('../../');


/**
 * [exports description]
 * @return {
 *   setup     {Function}
 *   teardown  {Function}
 *   outputDir {String}
 *   srcFiles  {Array}
 * }
 */
module.exports = function() {

  // Create an array of file fixtures.
  var fileFixtures = [];

  // Making a seperate group of larger files.
  var bigFileFixtures = [];

  // Create a tmp directory for our uploads to live in.
  var outputDir = new tmp.Dir();


  // Expose some things
  var public = {

    srcFiles: fileFixtures,

    bigSrcFiles: bigFileFixtures,

    outputDir: outputDir,

    setup: function(done) {

      // Write nonsense bytes to our file fixtures.
      for (var bytes = 10; bytes < 10000000; bytes *= 10) {
        var f = new tmp.File();
        var EOF = '\x04';
        f.writeFileSync(crypto.pseudoRandomBytes(bytes) + EOF);
        f.size = bytes;
        fileFixtures.push(f);
      }

      //5 MB?
      var bigFileSize = 7 * 1000 * 1000;

      for (var i = 0; i < 1; i++) {
        var f = new tmp.File();
        var EOF = '\x04';
        f.writeFileSync(crypto.pseudoRandomBytes(bigFileSize) + EOF);
        f.size = bigFileSize;
        bigFileFixtures.push(f);
      }

      // Bootstrap a little express app that uses file-parser
      // to upload files to our outputDir
      public.app = Express();

      // Use file-parser middleware
      public.app.use(Skipper());

      // Provide a default outputPath for testing purposes
      // (gets used by the test receiver to write the test file to disk in each suite)
      public.app.use(function(req, res, next) {
        req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR = path.join(outputDir.path, 'avatar.jpg');
        req.__FILE_PARSER_TESTS__OUTPUT_PATH = outputDir.path;
        next();
      });


      // Lift Express server on 3000
      public.server =
        http.createServer(public.app)
        .listen(3000)
        .on('listening', done);
    },

    teardown: function() {

      // Clean up fixtures.
      _.each(fileFixtures, function(f) {
        f.unlinkSync();
      });

      // Clean up directory w/ test output.
      fsx.removeSync(outputDir.path);

      // Lower Express server
      public.server.close();
    }
  };

  return public;
};
