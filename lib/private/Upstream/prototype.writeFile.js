/**
 * Module dependencies
 */

var debug = require('debug')('skipper');
var Writable = require('stream').Writable; // (for the leaky pipe)


module.exports = function writeFile (__filestream) {

  var self = this;

  var newFile = {
    stream: __filestream,
    status: 'bufferingOrWriting'
  };

  // Provide `__filestream.field` as alias to `__filestream.name`
  // for consistency within the receiver (final uploaded files
  // metadata objects have a `field` property)
  __filestream.field = __filestream.name;

  // Track incoming file stream for use in metadata sent back
  // from `.upload()` and also in case we need to cancel it:
  self._files.push(newFile);

  // Set up error handler for the new __filestream:
  //
  // An error can be emitted on this stream more than once by underlying libraries such as multiparty
  // Mark this event as fired already so we do not pipe the stream twice to the 'leaky' stream.
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Why?
  // If the __filestream is not being consumed (i.e. this Upstream is not
  // `connected` to anything), then we shouldn't allow errors on it to
  // go unhandled (since it would throw, causing the server to crash).
  //
  // On the other hand, if this Upstream is already hooked up to one or more
  // receivers, we're counting on them to listen for "READ" errors on each incoming
  // file stream and handle them accordingly.
  // (i.e. cancel the write and garbage collect the already-written bytes)
  //
  // So basically, in both cases, right here we'll just sort of catch the file
  // READ error and... well, do _almost_ nothing (see below.)
  //
  // > (Keep in mind-- an error event will still be emitted on the actual
  // > Upstream itself, but that's happening elsewhere.)
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var hasFileStreamErrorEventFired = false;
  __filestream.on('error', function(unusedErr) {

    // Pump any remaining chunks from the __filestream into the leaky pipe.
    // > Note: It's absolutely crucial that this pipe to a `leaky` Writable
    // > for everything to work.  Otherwise, responses never get sent.
    if (!hasFileStreamErrorEventFired) {
      var leaky = new Writable();
      leaky._write = function(chunk, encoding, cb) {
        cb();
      };
      __filestream.unpipe();
      __filestream.pipe(leaky);
      debug('Piping the not-yet-written bytes from incoming file `' + __filestream.filename + '` to the memory hole..');
    }

    hasFileStreamErrorEventFired = true;
  });//œ


  // Pump out the new file
  // (Upstream is a Readable stream, remember?)
  self.push(__filestream);

  // <PERHAPS?>
  // FUTURE: If the push returned false, stop pushing files for a bit
  // (this would involve pausing the flow of incoming part streams
  //  coming from the `on("part")` signals emitted from the MPU request)
  // ```
  // var isBackedUp = !self.push(__filestream);
  // ```
  //
  // Easy enough right?
  // -BUT-
  // Here's the challenge- the incoming MPU form closing will cause Skipper
  // to stop listening for new files.  So we must always push __filestreams as soon
  // as they arrive.  Not sure if changing this is even preferable...
  // </PERHAPS?>

  debug('Upstream: Pumping incoming file through field `%s`', self.fieldName);

};
