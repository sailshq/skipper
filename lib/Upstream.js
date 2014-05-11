/**
 * Module dependencies
 */

var Readable = require('stream').Readable;
var Writable = require('stream').Writable; // (for the leaky pipe)
var _ = require('lodash');
var log = require('./logger');
var util = require('util');
var SkipperDisk = require('skipper-disk');


// Extend Readable
util.inherits(Upstream, Readable);

/**
 * Constructor
 * @param {[type]} opts [description]
 */
function Upstream (opts) {
  var self = this;

  opts = opts || {};
  _.defaults(opts, {
    // highWaterMark: 0,
    objectMode: true,

    // The max # of ms this Upstream will wait without receiving a file
    // before getting frustrated and emitting an error.  (This will tell
    // any connected receivers (writestreams) that they ought to just give
    // up themselves.  This, in turn, triggers the callback for `req.file().upload()`
    // (no buffering is happening, so it's ok for this to be longer)
    // This needs to be long enough to allow any policies/middleware to run.
    // Should not need to exceed 500ms in most cases.
    maxTimeToWaitForFirstFile: 500,

    // The max # of ms this Upstream will buffer bytes and wait to be plugged
    // into a receiver.  highWaterMark isn't quite enough, since we want to be
    // allow significant buffering in-memory, but we also want to timeout when the
    // really silly sort of requests come in.
    maxTimeToBuffer: 500
  });

  // Allow `noop` to be passed in to force this Upstream to immediately end.
  if (opts.noop) this.isNoop = true;

  // Keep track of file streams which we've emitted.
  this._files = [];

  // Keep track of timeout timers.
  this.timeouts = {};

  Readable.call(this, opts);

  // Enforce the `maxTimeToWaitForFirstFile` option.
  this.timeouts.untilFirstFileTimer = setTimeout(function () {
    if (self._files.length === 0) {
      var e = new Error();
      e.code = 'ETIMEOUT';
      e.message =
      e.code + ': '+
      'An Upstream (`'+self.fieldName+'`) timed out waiting for file(s). '+
      'No files were sent after waiting '+opts.maxTimeToWaitForFirstFile+'ms.';
      self.fatalIncomingError(e);
    }
  }, opts.maxTimeToWaitForFirstFile);

  // Enforce the `maxTimeToBuffer` option.
  this.timeouts.untilMaxBufferTimer = setTimeout(function () {
    if ( !self._connected ) {
      var e = new Error();
      e.code = 'EMAXBUFFER';
      e.message =
      e.code + ': '+
      'An Upstream (`'+self.fieldName+'`) timed out before it was plugged into a receiver. '+
      'It was still unused after waiting '+opts.maxTimeToBuffer+'ms. '+
      'You can configure this timeout by changing the `maxTimeToBuffer` option.';
      self.fatalIncomingError(e);
    }
  }, opts.maxTimeToBuffer);
}




Upstream.prototype._read = function onNewDataRequested ( numBytesRequested ) {
  if ( numBytesRequested === 0) return;

  // Don't really need to do anything in here for now as far as pushing data--
  // we'll push to the receiving writestream when we're ready.
  log(('Something is trying to read from Upstream `'+this.fieldName+'`...').grey);


  // If we are a no-op Upstream, push `null` (ending the pipe) as soon
  // as something tries to read us.
  if ( this.isNoop ) return this.noMoreFiles();
};




/**
 * Override pipe so we know when this starts getting consumed.
 *
 * Here, we set a flag indicating that we're being read out of
 * by at least one connected receiver.
 *
 * @this {Upstream}
 * @return {Upstream} this
 * @chainable
 */

Upstream.prototype.pipe = function () {
  this._connected = true;
  return Readable.prototype.pipe.apply(this, Array.prototype.slice.call(arguments));
};




/**
 * upload()
 *
 * Convenience method to pipe to a write stream
 * and provide a traditional node callback.
 *
 * Usage:
 *
 * ```
 * .upload(receiver, cb)
 * .upload(receiver)
 * .upload(cb)
 * .upload()
 * ```
 *
 * @param  {stream.Writable}   receiver__
 * @param  {Function} cb
 * @return {Upstream}
 * @this {Upstream}
 * @api public
 * @chainable
 */
Upstream.prototype.upload = function ( receiver__, cb ) {
  var USAGE = '.upload([receiver] [,callback])';
  var self = this;

  // If no `receiver__` was specified...
  if (!cb && typeof receiver__ === 'function') {
    cb = receiver__;
    receiver__ = undefined;
  }

  // Check that a valid receiver was passed in
  var isValid =
    typeof receiver__ === 'object' &&
    receiver__ instanceof Writable;


  if (!isValid) {

    // If the first argument appears to be a configuration object
    // or string path (or it doesn't exist), instantiate a default
    // receiver stream with the specified options and use that.
    var receiverOpts = {};
    if (typeof receiver__ === 'object') {
      _.merge(receiverOpts, receiver__);
      receiver__ = SkipperDisk().receiver(receiverOpts);
    }
    else if (typeof receiver__ === 'string') {
      receiverOpts.id = receiver__;
      receiver__ = SkipperDisk().receiver({
        id: receiverOpts.id
      });
    }
    else if (typeof receiver === 'undefined') {
      receiver__ = SkipperDisk().receiver();
    }
    else {
      // Otherwise, this is an error
      var err = new Error('No valid receiver specified!');
      err.usage = USAGE;
      err.toString = function () {
        return err.message + '\nUsage: ' + err.usage + '\n';
      };

      if (typeof cb !== 'function') return err;
      else throw err;
    }

  }

  // Write stream finished successfully!
  receiver__.once('finish', function allFilesUploaded () {
    log(('A receiver is finished writing files from Upstream `'+self.fieldName+'`.').grey);
    log('(this doesn\'t necessarily mean any files were actually written...)'.grey);

    cb(null, self.serializeFiles());
  });

  // Write stream encountered a fatal error and had to quit early!
  // (some of the files may still have been successfully written, though)
  receiver__.once('error', function unableToUpload (err) {
    log(('A receiver handling Upstream `'+self.fieldName+'` encountered a write error :'+util.inspect(err)).red);

    cb(err, self.serializeFiles());
  });

  // Pipe to the (Writeable) receiver.  Every time the file parser encounters a new file
  // on this stream (i.e. a new file in the same form field), it will call Upstream's
  // writeFile method, which will push the new file stream into Upstream's buffer.  The
  // piping mechanism will then cause "_write" to be called on the Receiver, so it can
  // handle the file in whatever way it sees fit (saving to disk, streaming to S3, etc.)
  this.pipe( receiver__ );

  // Chainable
  return this;
};



/**
 * Extract metadata for this Upstream's files.
 *
 * @return {Array}
 */
Upstream.prototype.serializeFiles = function ( ) {
  var self = this;
  return _.reduce(self._files, function (memo, file) {
    memo.push({

      // Conventional bodyParser stuff:
      size: file.stream.byteCount,
      type: file.stream.headers && file.stream.headers['content-type'],

      // Custom stuff:
      filename: file.stream.filename,
      status: file.status,
      field: self.fieldName,
      extra: file.stream.extra

    });
    return memo;
  }, []);
};



Upstream.prototype.writeFile = function ( filestream ) {

  // Track incoming file stream in case we need
  // to cancel it:
  this._files.push({
    stream: filestream,
    status: 'bufferingOrWriting'
  });



  // Set up error handlers for the new filestream:
  //
  var self = this;
  filestream.once('error', function (err) {

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
    leaky._write = function (chunk,encoding, cb) { cb(); };
    filestream.unpipe();
    filestream.pipe( leaky );
    log('Piping the not-yet-written bytes from incoming file `'+filestream.filename+'` to the memory hole..');
  });

  // Pump out the new file
  // (Upstream is a Readable stream, remember?)
  this.push(filestream);
  log(('Upstream: Pumping incoming file through field `'+this.fieldName+'`').grey);
};



/**
 * Called by parser implementation to signal the end of the Upstream.
 * (i.e. no more files are coming)
 *
 * Anyone trying to `read()` Upstream will no longer be able to get
 * any files from it.
 *
 */
Upstream.prototype.noMoreFiles = function () {
  log(('Upstream: No more files will be sent through field `'+this.fieldName+'`').grey);
  this.push(null);

  // Clear all timeouts
  _(this.timeouts).each(function (timer, key) {
    clearTimeout(timer);
  });
};




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
Upstream.prototype.fatalIncomingError = function (err) {

  // Log message indicating that we are now aborting/cancelling all
  // future, current, and previously uploaded files from this Upstream.
  log(('Fatal incoming error in Upstream `'+this.fieldName+'` ::   (source or user may have cancelled the request)').red);
  log(err.toString && err.toString().red);
  log('-----------'.red);
  log(err.code);
  log(util.inspect(err.message) + ' - ' + util.inspect(err.name));
  log('-----------'.red);

  // Emit an error event to any of file streams in this Upstream
  // which are still being consumed.
  //
  // Any `receiver__`s reading this Upstream are responsible for listening to
  // 'error' events on the incoming file readstream(s).  On receipt of such a
  // "READ" error, they should cancel the upload and garbage-collect any bytes
  // which were already written to the destination writestream(s).
  //
  // Receivers should, of course, ALSO listen for "WRITE" errors ('error' events on
  // the outgoing writestream for each file.  The behavior is probably pretty much
  // the same in both cases, although a receiver might, for instance, choose to retry using
  // exponential back-off in the case of a "WRITE" error.  But on receiving a "READ" error,
  // it should always immediately stop.  This is because such an error is usually more
  // serious, and might even be an indication of the user trying to cancel a file upload.
  _(this._files).each(function (file) {
    file.status = 'cancelled';
    file.stream.emit('error', err);
    log(('Upstream: "READ" error on incoming file `'+file.stream.filename+'` ::'+err).red);
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

};




module.exports = Upstream;

