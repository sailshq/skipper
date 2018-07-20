/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var debug = require('debug')('skipper');
var Upstream = require('../Upstream');


/**
 * Find the Upstream with `fieldName`, or
 * create and save it for the first time if necessary.
 * (Takes care of managing the collection of upstreams.)
 *
 * @param  {String} fieldName
 * @return {Upstream}
 */

module.exports = function acquireUpstream(fieldName) {

  var existingStream = _.find(this.upstreams, {
    fieldName: fieldName
  });
  if (existingStream) { return existingStream; }


  // If the Parser has `closed` or `_multipartyError` set to true, the request/form
  // has already been completely parsed.  Since we don't recognize
  // the field/Upstream, this must be a call to `req.file('foo')`,
  // where 'foo' is not a file that is going to be coming in.
  // So, we return a Noop stream which will immediately end itself.
  if (this.closed || this._multipartyError) {
    var noopUpstream = new Upstream({
      noop: true
    });
    noopUpstream.fieldName = 'NOOP_'+fieldName;
    return noopUpstream;
  }

  // Otherwise, we're good.  We should instantiate a new Upstream
  // and assign its `fieldName`,
  var newUpstream = new Upstream({
    // Apply configurable timeout options
    maxTimeToWaitForFirstFile: this.options.maxTimeToWaitForFirstFile,
    maxTimeToBuffer: this.options.maxTimeToBuffer
  });
  debug('Acquiring new Upstream for field `' + fieldName + '`');
  newUpstream.fieldName = fieldName;
  this.upstreams.push(newUpstream);


  // If the new Upstream ever emits 'error' events ("READ" error),
  var self = this;
  newUpstream.on('error', function(err) {

    // Terminate the request early (call `next(err)`)
    if (!self._hasPassedControlToApp) {
      self._hasPassedControlToApp = true;
      debug('Error occurred in form before control was passed.  Passing control to app error handler...');
      return self.next(err);
    }
    // Otherwise control has already been passed, but nothing has been hooked
    // up yet, so we can't really do anything particularly helpful.
    // We'll just log a warning.
    // (this is all to keep from throwing and crashing the app)
    else {
      self.emit('warning', String(err));
    }
  });//œ


  return newUpstream;

};
