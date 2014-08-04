/**
 * Module dependencies
 */

var log = require('../logger');
var buildOrNormalizeReceiver = require('./build-or-normalize-receiver');
var r_buildRenamerStream = require('./build-renamer-stream');


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
 * @param  {Function} cb
 * @return {Upstream}
 * @this {Upstream}
 * @api public
 * @chainable
 */

module.exports = function upload (opts, cb) {
  var self = this;
  var USAGE = '.upload([receiver] [,callback])';

  // If first parameter is the callback-function not a `receiver__`
  if (!arguments[1] && typeof arguments[0] === 'function') {
    cb = opts;
    opts = undefined;
  }

  // Locate, normalize, and/or build a receiver instance using the value passed in
  // as the first argument (`receiver__`)
  var receiver__;
  try { receiver__ = buildOrNormalizeReceiver(opts); }
  catch (e) {
    if (typeof cb === 'function') return cb(e);
    throw e; // (perhaps emit an error on the upstream instead?)
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
    dirname: opts.dirname
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


