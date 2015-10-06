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


describe('req.body (URL-encoded parser) ::', function() {
	var suite = Lifecycle();
	before(suite.setup);
	after(suite.teardown);


	// Object of params accessible in req.body in the upload action
	var bodyParamsThatWereAccessible = {};


  before(function() {
		suite.app.post('/urlencoded', function (req, res) {
			bodyParamsThatWereAccessible = _.cloneDeep(req.body);

			req.file('avatar')
				.upload(function(err, files) {
          res.json({
            body: bodyParamsThatWereAccessible,
            files: files
          });
        });
		});
  });


	describe('sending an application/x-www-form-urlencoded content-type request', function() {

    var res;
    before(function(done) {
      request.post({
        url: 'http://localhost:3000/urlencoded',
        form: {
          foo: 'bar',
          abc: 123
        }
      }, function(err, _res) {
        if (err) {return done(err);}
        res = _res;
        res.body = JSON.parse(res.body);
        return done();
      });
    });

    it('should have all of the correct body params', function() {
      assert.equal(res.body.body.foo, 'bar');
      assert.equal(res.body.body.abc, 123);
      assert.equal(_.keys(res.body.body).length, 2);
    });

    it('should have an empty files array',  function() {
      assert(_.isArray(res.body.files));
      assert.equal(res.body.files.length, 0);
    });

  });

});
