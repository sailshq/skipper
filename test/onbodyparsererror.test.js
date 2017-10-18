/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, request = require('request')
	, _ = require('lodash')
	, util = require('util')
	, path = require('path')
	, assert = require('assert')
	, toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse')
	, fsx = require('fs-extra');


describe('onBodyParserError ::', function() {

  describe('basic functioning', function() {

    var suite = Lifecycle();
    before(function(done) {
      return suite.setup({onBodyParserError: function(err, req, res, next) {
        return res.send('okey doke!');
      }}, done);
    });
    after(suite.teardown);

    it('should run the onBodyParserError function when there\'s an error parsing the body', function(done) {

      suite.app.post('/', function (req, res) {
        return done(new Error('Should not have run route handler!'));
      });

      request.post({
        url: 'http://localhost:3000/',
        headers: {
          'content-type': 'application/json'
        },
        body: 'foobar'
      }, function(err, _res) {
        if (err) {return done(err);}
        res = _res;
        assert.equal(res.body, 'okey doke!');
        return done();
      });

    });

  });

});

if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) >= 7.6) {

  describe('with async function', function() {

    describe('basic functioning', function() {

      var suite = Lifecycle();
      before(function(done) {
        return suite.setup({onBodyParserError: require('./fixtures/asyncOnBodyParserError.js')}, done);
      });
      after(suite.teardown);

      it('should run the onBodyParserError function when there\'s an error parsing the body', function(done) {

        suite.app.post('/', function (req, res) {
          return done(new Error('Should not have run route handler!'));
        });

        request.post({
          url: 'http://localhost:3000/?status=ok',
          headers: {
            'content-type': 'application/json'
          },
          body: 'foobar'
        }, function(err, _res) {
          if (err) {return done(err);}
          res = _res;
          assert.equal(res.body, 'ok');
          return done();
        });

      });

      it('should catch errors thrown in the function', function(done) {

        suite.app.post('/', function (req, res) {
          return done(new Error('Should not have run route handler!'));
        });

        suite.app.use(function(err, req, res, next) {
          return res.send('caught!');
        });

        request.post({
          url: 'http://localhost:3000/?status=error',
          headers: {
            'content-type': 'application/json'
          },
          body: 'foobar'
        }, function(err, _res) {
          if (err) {return done(err);}
          res = _res;
          assert.equal(res.body, 'caught!');
          return done();
        });

      });

    });

  });

}

