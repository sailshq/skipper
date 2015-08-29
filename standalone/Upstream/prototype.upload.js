/**
 * Module dependencies
 */

var _ = require('lodash');
var path = require('path');
var util = require('util');
var log = require('../logger');
var buildOrNormalizeReceiver = require('./build-or-normalize-receiver');
var r_buildRenamerStream = require('./build-renamer-stream');
var debug = require('debug')('skipper');
var Writable = require('stream').Writable; // (for the leaky pipe)


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
 * ```
 *
 * Alternate usage:
 * ```
 * .upload("filename.jpg")
 * .upload({adapter: {receive: receiver}})
 * ```
 *
 * @param  {String|Object|stream.Writable}   opts [optional]
 * @param  {Function} _cb
 * @return {Upstream}
 * @this {Upstream}
 * @api public
 * @chainable
 */

module.exports = function upload (opts, _cb) {
  var self = this;
  var USAGE = '.upload([receiver] [,callback])';

  // If first parameter is the callback-function not a `receiver__`
  if (!arguments[1] && typeof arguments[0] === 'function') {
    _cb = opts;
    opts = {};
  }

  // Handle first argument when it's specified as string
  // (save it as the `saveAs` opt)
  if (typeof opts === 'string') {
    opts = { saveAs: opts };
  }

  // Handle `saveAs` when it's specified as string (normalize to fn)
  if (typeof opts === 'object' && typeof opts.saveAs === 'string') {

    // If the string has a leading `/`, interpret it as an absolute path.
    // In that case, we'll infer a value for the "dirname" option.
    if (!!opts.saveAs.match(/^\//)) {
      opts.dirname = opts.dirname || path.dirname(opts.saveAs);
      opts.saveAs = path.basename(opts.saveAs);
    }
    // And in any case, we'll normalize "saveAs" to a function
    var desiredFilename = opts.saveAs;
    opts.saveAs = function (__newFile, next) {
      next(null, desiredFilename);
    };
  }

  // Ensure callback exists and can only be triggered once
  var cbTriggered;
  var cb = function (err, files){
    if (cbTriggered) return;
    cbTriggered = true;

    if (typeof _cb === 'function') {
      return _cb(err, files);
    }
    if (err) {
      throw err; // (perhaps emit an error on the upstream instead?)
    }
  };

  debug('.upload() called on upstream');

  // If a fatal error occurred on this upstream before upload()
  // was called, trigger the callback immediately.
  if (self._fatalErrors.length > 0) {
    debug('Triggering cb w/ error--upstream already has fatal error: %s', self._fatalErrors[0]);
    // self.pipe()
    _(self._files).each(function(file) {
      var leaky = new Writable();
      leaky._write = function(chunk, encoding, cb) {
        cb();
      };
      file.stream.unpipe();
      file.stream.pipe(leaky);
    });
    // self.unpipe();
    // self.unpipe()
    return cb(self._fatalErrors[0]);
  }

  // If error is emitted on this upstream, trigger the callback
  self.once('error', function (err){
    debug('upstream emitted error, forcing us to trigger the callback for .upload() with err: %s',err);
    return cb(err);
  });

  // Locate, normalize, and/or build a receiver instance using the value passed in
  // as the first argument (`receiver__`)
  var receiver__;
  try { receiver__ = buildOrNormalizeReceiver(opts); }
  catch (e) {
    return cb(e);
  }

  // For convenience, pump progress events from the receiver
  // to this upstream.  This allows for interchangable, chainable
  // usage, e.g. `req.file().upload(...).on('progress', ...)`
  receiver__.on('progress', function(milestone) {
    self.emit('progress', milestone);
  });

  // The receiver write stream finished successfully!
  receiver__.once('finish', function allFilesUploaded() {
    log.color('grey').write('A receiver is finished writing files from Upstream `' + self.fieldName + '`.');
    log.color('grey').write('(this doesn\'t necessarily mean any files were actually written...)');
    cb(null, self.serializeFiles());
  });

  // Write stream encountered a fatal error and had to quit early!
  // (some of the files may still have been successfully written, though)
  receiver__.once('error', function unableToUpload(err) {
    log.color('red').write('A receiver handling Upstream `%s` encountered a write error :', self.fieldName, util.inspect(err));

    // Forcibly end the incoming stream of files on this upstream
    self.fatalIncomingError(err);

    // Trigger callback
    cb(err, self.serializeFiles());
  });

  // Build a renamer stream which will construct an `fd` for each incoming file
  // will use the `saveAs` option, or fallback to a UUID.  Also respects `dirname`
  // if provided.
  //
  // So like, the implementation here is really just a shim to make it easier to write
  // FSAdapters by bundling reasonable file renaming functionality out of the box.
  // Bear in mind that the receiver may change this `fd`- that's completely up to it.
  // (for instance the disk adapter resolves paths relative to the current working
  // directory of the Skipper process).  All a receiver needs to do is override the
  // `fd` property on the incoming file stream itself; and of course persist the file
  // in the revised spot.  Then when skipper calls the .upload() callback, it will
  // transparently pass down the updated `fd` in the metadata object for that uploaded
  // file.
  var __renamer__ = r_buildRenamerStream({
    saveAs: opts.saveAs,
    dirname: opts.dirname,
    log: log
  });


  // Pipe to the (Writeable) receiver.  Every time the file parser encounters a new file
  // on this stream (i.e. a new file in the same form field), it will call Upstream's
  // writeFile method, which will push the new file stream into Upstream's buffer.  The
  // piping mechanism will then cause "_write" to be called on the Receiver, so it can
  // handle the file in whatever way it sees fit (saving to disk, streaming to S3, etc.)
  self.pipe(__renamer__).pipe(receiver__);

  // Chainable
  return self;
};


