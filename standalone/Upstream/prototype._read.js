/**
 * Module dependencies
 */

var log = require('../logger');




module.exports = function onNewDataRequested(numBytesRequested) {
  if (numBytesRequested === 0) return;

  // Don't really need to do anything in here for now as far as pushing data--
  // we'll push to the receiving writestream when we're ready.
  log.color('grey').write('Something is trying to read from Upstream `%s`...',this.fieldName);


  // If we are a no-op Upstream, push `null` (ending the pipe) as soon
  // as something tries to read us.
  if (this.isNoop) return this.noMoreFiles();
};
