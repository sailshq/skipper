/**
 * Module dependencies
 */

var fsx = require('fs-extra');
var _ = require('@sailshq/lodash');
var assert = require('assert');
var tmp = require('temporary');
var crypto = require('crypto');
var log = require('./helpers/logger');
var async = require('async');
var path = require('path');
var Express = require('express');
var Uploader = require('./helpers/uploader');
var http = require('http');
var toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse');
var newReceiverStream = require('./helpers/receiver').newReceiverStream;
var Form = require('multiparty').Form;



//////////////////////////////////////////
//////////////////////////////////////////
///
///
/// TEST CONFIG
///
//////////////////////////////////////////

// Size of file to use in simulated upload
// (# of psuedo-random bytes to generate)
var BYTES = 100000;

//////////////////////////////////////////
//////////////////////////////////////////



xdescribe('multipart form upload', function() {

  //
  // Basic sanity check on multipart form parser's
  // functionality.  Check that part streams are valid
  // and that our other base expectations hold.
  //


  // Write nonsense bytes to a file fixture.
  var EOF = '\x04';
  var fileFixture = new tmp.File();
  fileFixture.writeFileSync(crypto.pseudoRandomBytes(BYTES) + EOF);
  fileFixture.size = BYTES;

  // Create a tmp directory for our uploads to live in.
  var outputDir = new tmp.Dir();


  // Lift express server.
  var app = Express();
  var server;
  before(function(done) {
    server = http.createServer(app)
      .listen(3000)
      .on('listening', done);
  });

  after(function() {

    // Lower express server.
    server.close();

    // Clean up file fixture.
    fileFixture.unlinkSync();

    // Clean up directory w/ test output.
    fsx.removeSync(outputDir.path);
  });


  it('uses the multipart form parsing middleware', function() {
    app.use(function(req, res, next) {
      next();
    });
  });


  it('binds an action that will upload our test file', function() {
    app.post('/upload', function(req, res) {


      var form = new Form();

      async.auto({
        formClosed: function(cb) {
          form.on('close', function() {
            log('Form: emitted `close`');
            cb();
          });
        },
        allPartsWritten: function(cb) {

          var q = async.queue(function(task, cb) {
            var part = task;

            var size = part.byteCount - part.byteOffset;
            var name = part.filename;

            log(('Form: received part: ' + name + ' with ' + size + ' bytes'));

            // Add '*' event to part stream to allow us to tap in
            // and watch all events. (for testing only)
            // ((function wildcardify(emitter, websocket) {
            // 	var oldEmit = emitter.emit;
            // 	emitter.emit = function() {
            // 		var restOfArgs = Array.prototype.slice.call(arguments);
            // 		log(':::DEBUG:::     partstream `'+name+'` emitted :', arguments);
            // 		oldEmit.apply(emitter, restOfArgs);
            // 	};
            // 	return emitter;
            // })(part));

            // Pipe the file someplace
            var box = new(require('stream').Writable)();
            box._write = function(chunk, encoding, next) {

              // Simulate a delayed write
              setTimeout(function() {
                log('Wrote chunk');
                next();
              }, 150);
            };
            part.pipe(box);

            box.on('finish', function() {
              log('File written successfully.');
              cb();
            });


            // Just for diagnostics:
            // part.on('readable', function () {
            // 	var chunk = this.read();
            // 	if (!chunk) return log('done with part');
            // 	return log('got chunk');
            // });
          }, 2);

          q.drain = function() {
            // done w/ form
            cb();
          };

          form.on('part', function whenNewPartStreamIsReceived(part) {
            if (!part.filename) return;
            q.push(part, function optional(err) {});
          });
        }
      }, function allDone(err) {
        if (err) res.send(500, err);
        res.sendStatus(200);
        log('All files uploaded.');
      });

      form.parse(req);

    });
  });


  it('should upload the file when after the request is sent', function(done) {

    // Builds an HTTP request
    var httpRequest = Uploader({
      baseurl: 'http://localhost:3000'
    }, toValidateTheHTTPResponse(done));

    // Attaches a multi-part form upload to the HTTP request.
    var form = httpRequest.form();
    var file = fileFixture;
    var pathToFile = fileFixture.path;
    form.append('foo', 'hello');
    form.append('bar', 'there');
    form.append('avatar', fsx.createReadStream(pathToFile));
    form.append('avatar', fsx.createReadStream(pathToFile));
  });


});
