/**
 * Module dependencies
 */

var debug = require('debug')('skipper');




module.exports = function onNewDataRequested(numBytesRequested) {
  if (numBytesRequested === 0) { return; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE:
  // Re the note about pausing pushing of files in `prototype.writeFile.js`:
  // This is probably where we'd resume the flow of incoming part streams
  // coming off the MPU request.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // Don't really need to do anything in here for now as far as pushing data--
  // we'll push to the receiving writestream when we're ready.
  debug('Something is trying to read from Upstream `%s`...',this.fieldName);


  // If we are a no-op Upstream, push `null` (ending the pipe) as soon
  // as something tries to read us.
  if (this.isNoop) { return this.noMoreFiles(); }
};
