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
describe('maxTimeToBuffer', function() {

  this.timeout(3000);

  describe('with a setting of 600 and a 1200ms delay', function() {

    describe('with at least one file connected to a receiver', function() {

      var suite = Lifecycle();
      var timer;

      before(function(done) {
        suite.setup({maxTimeToBuffer: 600}, done);
      });

      after(suite.teardown);

      before(function () {
        // Set up a route which listens to uploads
        suite.app.post('/upload_maxTimeToBuffer', function (req, res, next) {

          assert(_.isFunction(req.file));

          // Disable underlying socket timeout
          // THIS IS IMPORTANT
          // see https://github.com/joyent/node/issues/4704#issuecomment-42763313
          res.setTimeout(0);
          // res.send(200);
          req.file('foo').upload(newReceiverStream({
            maxBytes: 2000000 // 2 MB
          }), function (err, files) {
            if (err) {
              return res.status(500).send(err.code);
            }
            return res.status(200).json(files);
          });
        });

      });

      it('should result in a successful request (EMAXBUFFER should be swallowed)', function(done) {
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
          'Content-Disposition: form-data; name="foo"; filename="foo.txt"\r\n',
          'Content-Type: text/plain\r\n',
          'Content-Transfer-Encoding: binary\r\n',
          '\r\n',
          Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
          Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
          '\r\n--myawesomemultipartboundary\r\n',
          'Content-Disposition: form-data; name="avatar"; filename="avatar.txt"\r\n',
          'Content-Type: text/plain\r\n',
          'Content-Transfer-Encoding: binary\r\n',
          '\r\n',
          Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
          Buffer.from([ 115, 97, 105, 108, 115, 98, 111, 116, 52, 101, 118, 97 ]),
          '\r\n--myawesomemultipartboundary--\r\n'
        ];

        // Calculate the content size.
        var contentSize = _.reduce(body, function(memo,chunk){return memo+chunk.length;}, 0);

        // Set up the request options
        var options = {
          host: 'localhost',
          port: 3000,
          path: '/upload_maxTimeToBuffer',
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
              assert.equal(response.statusCode, 200);
              var data = JSON.parse(body);
              assert.equal(data.length, 1);
              assert.equal(data[0].filename, 'foo.txt');
              return done();
            });
          }
        );

        // Handle the request error
        req.on('error', function(e)  {
          clearTimeout(timer);
          return done(e);
        });

        // Write all the chunks except the last one
        _.map(body.slice(1), function(chunk) {req.write(chunk);});

        // Wait to end the request
        timer = setTimeout(function(){
          req.write(_.last(body));
          req.end();
        }, 1200);

      });

    });

  });

});
