/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var debug = require('debug')('skipper');



/**
 * Called by parser implementation to signal the end of the Upstream.
 * (i.e. no more files are coming)
 *
 * Anyone trying to `read()` Upstream will no longer be able to get
 * any files from it.
 *
 */

module.exports = function noMoreFiles () {
  debug('Upstream: No more files will be sent through field `%s`- clearing timeouts...', this.fieldName);
  this.push(null);

  // Clear all timeouts
  _.each(this.timeouts, function(timer, unusedKey) {
    clearTimeout(timer);
  });
};
