/**
 * Module dependencies
 */

var Writable = require('stream').Writable; // (for the leaky pipe)
var log = require('../logger');




module.exports = function writeFile (filestream) {

  // Track incoming file stream in case we need
  // to cancel it:
  this._files.push({
    stream: filestream,
    status: 'bufferingOrWriting'
  });



  // Set up error handlers for the new filestream:
  //
  var self = this;
  filestream.once('error', function(err) {

    // If the filestream is not being consumed (i.e. this Upstream is not
    // `connected` to anything), then we shouldn't allow errors on it to
    // go unhandled (since it would throw, causing the server to crash).

    // On the other hand, if this Upstream is already hooked up to one or more
    // receivers, we're counting on them to listen for "READ" errors on each incoming
    // file stream and handle them accordingly.
    // (i.e. cancel the write and garbage collect the already-written bytes)

    // So basically, in both cases, we'll sort of just catch the file
    // READ error and... well, do nothing.
    //
    // (keep in mind-- an error event will still be emitted on the actual
    // Upstream itself, but that's happening elsewhere.)


    // Pump any remaining chunks from the filestream into the leaky pipe
    // TODO:
    // I suppose it's possible this step may need to change later, but only
    // if we want receivers to be able to continue to use the filestreams after
    // an error occurs (I don't see why we would..)
    // Anyways, it's absolutely crucial that this pipe to a `leaky` Writable
    // for everything to work.  Otherwise, responses never get sent.
    var leaky = new Writable();
    leaky._write = function(chunk, encoding, cb) {
      cb();
    };
    filestream.unpipe();
    filestream.pipe(leaky);
    log('Piping the not-yet-written bytes from incoming file `' + filestream.filename + '` to the memory hole..');
  });

  // Pump out the new file
  // (Upstream is a Readable stream, remember?)
  this.push(filestream);
  log.color('grey').write('Upstream: Pumping incoming file through field `%s`', this.fieldName);
};
