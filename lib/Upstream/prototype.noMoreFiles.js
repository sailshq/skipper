/**
 * Module dependencies
 */

var _ = require('lodash');
var log = require('../logger');



/**
 * Called by parser implementation to signal the end of the Upstream.
 * (i.e. no more files are coming)
 *
 * Anyone trying to `read()` Upstream will no longer be able to get
 * any files from it.
 *
 */

module.exports = function noMoreFiles () {
  log.color('grey').write('Upstream: No more files will be sent through field `%s`', this.fieldName);
  this.push(null);

  // Clear all timeouts
  _(this.timeouts).each(function(timer, key) {
    clearTimeout(timer);
  });
};
