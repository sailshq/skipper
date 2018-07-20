/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle')
	, request = require('request')
	, _ = require('@sailshq/lodash')
	, util = require('util')
	, path = require('path')
	, assert = require('assert')
	, toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse')
	, fsx = require('fs-extra');


describe('req.body (empty body) ::', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);


	// Object of params accessible in req.body in the upload action
	var bodyParamsThatWereAccessible = {};


  before(function() {
		suite.app.post('/empty', function (req, res) {
      res.json(req.body);
    });
  });


	describe('sending an empty body with a POST request', function() {

    var res;
    before(function(done) {
      request.post({
        url: 'http://localhost:3000/empty'
      }, function(err, _res) {
        if (err) {return done(err);}
        res = _res;
        try {
          res.body = JSON.parse(res.body);
        } catch (e) {
          return done('Could not parse body!');
        }
        return done();
      });
    });

    it('should return an empty object as the body', function() {
      assert(_.isEqual(res.body, {}));
    });

  });

});
