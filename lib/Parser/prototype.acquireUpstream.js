/**
 * Module dependencies
 */

var _ = require('lodash');
var log = require('../../standalone/logger');
var Upstream = require('../../standalone/Upstream');


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
  if (existingStream) return existingStream;


  // If the Parser has `closed` set to true, the request/form
  // has already been completely parsed.  Since we don't recognize
  // the field/Upstream, this must be a call to `req.file('foo')`,
  // where 'foo' is not a file that is going to be coming in.
  // So, we return a Noop stream which will immediately end itself.
  if (this.closed) {
    var noopUpstream = new Upstream({
      noop: true
    });
    noopUpstream.fieldName = 'NOOP_'+fieldName;
    return noopUpstream;
  }

  // Otherwise, we're good.  We should instantiate a new Upstream
  // and assign its `fieldName`,
  var newUpstream = new Upstream();
  log(('Acquiring new Upstream for field `' + fieldName + '`').grey);
  newUpstream.fieldName = fieldName;
  this.upstreams.push(newUpstream);


  // If the new Upstream ever emits an 'error' event ("READ" error),
  var self = this;
  newUpstream.on('error', function(err) {

    // terminate the request early (call `next(err)`)
    if (!self._hasPassedControlToApp) {
      self._hasPassedControlToApp = true;
      log('Error occurred in form before control was passed.  Passing control to app error handler...'.red);
      return self.next(err);
    }


    // if control has been passed, but nothing has been hooked up yet,
    // we can't really do anything particularly helpful.
    // We'll log a warning.
    // (this is all to keep from throwing and crashing the app)
    self.emit('warning', String(err));
    return;

  });


  return newUpstream;

};
