/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle'),
  _ = require('@sailshq/lodash'),
  assert = require('assert');


describe('test suite', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);

  it('should have access to file fixtures', function() {
    assert(_.isArray(suite.srcFiles));
    assert(suite.srcFiles.length >= 1);
    assert(_.isObject(suite.outputDir));
  });

});