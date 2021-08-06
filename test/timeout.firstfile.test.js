var Lifecycle = require('./helpers/lifecycle')
  , request = require('request')
  , _ = require('@sailshq/lodash')
  , util = require('util')
  , path = require('path')
  , assert = require('assert')
  , toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse')
  , newReceiverStream = require('./helpers/receiver').newReceiverStream
  , fsx = require('fs-extra');

var _ = require('@sailshq/lodash');
describe('maxTimeToWaitForFirstFile', function() {

  describe('with a setting of 600 and a 1200ms delay', function() {

    var suite = Lifecycle();
    var timer;

    before(function(done) {
      suite.setup({maxTimeToWaitForFirstFile: 600}, done);
    });

    after(suite.teardown);

    before(function () {
      // Set up a route which listens to uploads
      suite.app.post('/upload_maxTimeToWaitForFirstFile', function (req, res, next) {

        assert(_.isFunction(req.file));

        // Disable underlying socket timeout
        // THIS IS IMPORTANT
        // see https://github.com/joyent/node/issues/4704#issuecomment-42763313
        res.setTimeout(0);
        // res.send(200);
        req.file('avatar').upload(newReceiverStream({
          maxBytes: 2000000 // 2 MB
        }), function (err, files) {
          if (err) {
            return res.status(500).send(err.code);
          }
          return res.status(200).send();
        });
      });

    });

    it('should result in the `.upload()` callback being called with an ETIMEOUT error', function(done) {
      var http = require('http');

      // Create the body in pieces.  We could just do a bunch of req.write() calls,
      // but doing it this way lets us keep track of the content size so if we change
      // the intended body, we don't have to recalculate the size manually.
      var body = [
        '\r\n--myawesomemultipartboundary\r\n',
        'Content-Disposition: form-data; name="textfield";\r\n',
        'Content-Type: text/plain\r\n',
        '\r\n',
        Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
        '\r\n--myawesomemultipartboundary\r\n',
        'Content-Disposition: form-data; name="textfield";"\r\n',
        'Content-Type: text/plain\r\n',
        '\r\n',
        Buffer.from([65,65,65,65,65]),
        '\r\n--myawesomemultipartboundary\r\n',
        'Content-Disposition: form-data; name="avatar"; filename="somefiletokeep.txt"\r\n',
        'Content-Type: text/plain\r\n',
        'Content-Transfer-Encoding: binary\r\n',
        '\r\n',
        Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
        '\r\n--myawesomemultipartboundary--\r\n',
        // Note that we don't need to finish the body with the closing boundary because
        // we'll be aborting the request anyway
      ];

      // Calculate the content size.
      var contentSize = _.reduce(body, function(memo,chunk){return memo+chunk.length;}, 0);

      // Set up the request options
      var options = {
        host: 'localhost',
        port: 3000,
        path: '/upload_maxTimeToWaitForFirstFile',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data;boundary=myawesomemultipartboundary',
          'Content-Length': contentSize
        }
      };

      // Make the request
      var req = http.request(options,
        // This callback should never be called, since the request
        // should end in an error after we abort it
        function(response) {
          var body = '';
          response.on('data', function(chunk) {body += chunk.toString();});
          response.on('end', function() {
            assert.equal(response.statusCode, 500);
            assert.equal(body, 'ETIMEOUT');
            return done();
          });
        }
      );

      // Handle the request error
      req.on('error', function(e)  {
        clearTimeout(timer);
        return done(e);
      });

      // Write the first chunk
      req.write(body[0]);

      // Wait to send the rest of the chunks
      timer = setTimeout(function(){
        // Send the body one piece at a time
        _.map(body.slice(1), function(chunk) {req.write(chunk);});
        req.end();
      }, 1200);

    });

  });

});
