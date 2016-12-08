/**
 * Module dependencies
 */

var _ = require('lodash');
var util = require('util');
var log = require('../logger');
var debug = require('debug')('skipper');


/**
 * Called by parser implementation to signal an INCOMING fatal error
 * with one or more files being pumped by this Upstream.
 * This means that something went wrong or cancelled the entire file upload on the
 * "source" side (i.e. the request), and that we should invalidate the entire
 * upload.  An example of this scenario is if a user aborts the request.
 *
 * ------------------------------------------------------------------------
 * TODO:
 * Probably can deprecate this, since you almost always want to retain the
 * files that were already uploaded in this case.
 * ------------------------------------------------------------------------
 *
 * All future files on this Upstream are cancelled (stop listening to file parts)
 * and any currently-uploading files are invalidated.
 *
 * @param  {Error} err
 */
module.exports = function fatalIncomingError (err) {

  // Log message indicating that we are now aborting/cancelling all
  // future, current, and previously uploaded files from this Upstream.
  log.color('red').write('Fatal incoming error in Upstream `%s` ::   (source or user may have cancelled the request)',this.fieldName);
  log.color('red').write(err.toString && err.toString());
  log.color('red').write('-----------');
  log(err.code);
  log('%s - %s', util.inspect(err.message), util.inspect(err.name));
  log.color('red').write('-----------');

  // Emit an error event to any of file streams in this Upstream
  // which are still being consumed.
  //
  // Any `receiver__`s reading this Upstream are responsible for listening to
  // 'error' events on the incoming file readstream(s).  On receipt of such a
  // "READ" error, they should cancel the upload and garbage-collect any bytes
  // which were already written to the destination writestream(s).
  //
  // Receivers should, of course, ALSO listen for "WRITE" errors ('error' events on
  // the outgoing writestream for each file).  The behavior is probably pretty much
  // the same in both cases, although a receiver might, for instance, choose to retry using
  // exponential back-off in the case of a "WRITE" error.  But on receiving a "READ" error,
  // it should always immediately stop.  This is because such an error is usually more
  // serious, and might even be an indication of the user trying to cancel a file upload.
  var self = this;
  _.each(this._files, function(file) {

    // If the file has already been cancelled, return rather than emitting another error on the stream.
    // This is because depending on the adapter, an error on the stream may result in fatalIncomingError
    // being called again, and the receiver is only equipped to handle one fatal error (i.e. it uses
    // .once(), which makes sense since the error is supposed to be _fatal_, after all).
    if (file.status === 'cancelled') {
      debug('Swallowing fatal upstream error for already-cancelled incoming file `%s` of upstream `%s`', file.stream.filename, self.fieldName);
      return;
    }

    // If the file is finished, ignore the error.
    if (file.status === 'finished') {
      debug('Swallowing fatal upstream error for already-finished incoming file `%s` of upstream `%s`', file.stream.filename, self.fieldName);
      return;
    }

    // Mark the file as cancelled
    file.status = 'cancelled';

    // Output a debug message indicating that an error occurred on the incoming file.
    if (!self._connected){
      debug('Forwarding fatal upstream error for unconnected (i.e. not connected to receiver) incoming file `%s` of upstream `%s`', file.stream.filename, self.fieldName);
    } else {
      debug('Forwarding fatal upstream error for already-connected (to receiver) incoming file `%s` of upstream `%s`', file.stream.filename, self.fieldName);
    }

    // Forward the fatal upstream error to the actual file stream so that it can re-route to the leaky pipe.
    // Otherwise, the stream may never close, causing the response to hang.
    file.stream.emit('error', err);

  });

  // Indicate the end of the Upstream (no more files coming)
  this.noMoreFiles();


  // Finally, emit error on this Upstream itself to cause some real trouble.
  // If this Upstream is connected to something, this will trigger the error handler
  // on the receiving writestream, which might contain special behavior.
  // Otherwise, the error will be handled by the Parser, which will send a warning
  // back up to the request, or even potentially call `next(err)`, if the parser middleware
  // hasn't handed over control to the app yet.
  this.emit('error', err);

  // Track errors on this upstream in case its NOT connected to a receiver.
  // This allows us to intercept attemps to .upload() to it.
  this._fatalErrors.push(err);

};
