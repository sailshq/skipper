/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var Readable = require('stream').Readable;
var _ = require('lodash');
var DefaultFileAdapter = require('skipper-disk');



// Extend Readable
util.inherits(Upstream, Readable);

/**
 * Constructor
 * @param {[type]} opts [description]
 */
function Upstream(opts) {
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
    // allow significant buffering in-memory (/utilize back-pressure whenever possible),
    // but we also want to timeout when the really silly sort of requests come in.
    maxTimeToBuffer: 2500
  });

  // Allow `noop` to be passed in to force this Upstream to immediately end.
  if (opts.noop) this.isNoop = true;

  // Keep track of file streams which we've emitted.
  this._files = [];

  // Keep track of timeout timers.
  this.timeouts = {};

  Readable.call(this, opts);

  // Enforce the `maxTimeToWaitForFirstFile` option.
  this.timeouts.untilFirstFileTimer = setTimeout(function() {
    if (self._files.length === 0) {
      var e = new Error();
      e.code = 'ETIMEOUT';
      e.message =
        e.code + ': ' +
        'An Upstream (`' + self.fieldName + '`) timed out waiting for file(s). ' +
        'No files were sent after waiting ' + opts.maxTimeToWaitForFirstFile + 'ms.';
      self.fatalIncomingError(e);
    }
  }, opts.maxTimeToWaitForFirstFile);

  // Enforce the `maxTimeToBuffer` option.
  //
  // Note:
  // This consideration really ought to be taken care of by the normal highWaterMark
  // stuff.  As it is, you may not even want a `maxTimeToBuffer` in certain cases
  // since you may be perfectly happy waiting as long as necessary; provided back-pressure
  // is being properly applied in the receiver (we know with almost complete certainty that
  // it's being properly applied in the sending stream because it's a request- with the caveat
  // that it is possible to build your own fake request stream, e.g. the request interpreter in
  // Sails, or MockReq)
  this.timeouts.untilMaxBufferTimer = setTimeout(function() {
    if (!self._connected) {
      var e = new Error();
      e.code = 'EMAXBUFFER';
      e.message =
        e.code + ': ' +
        'An Upstream (`' + self.fieldName + '`) timed out before it was plugged into a receiver. ' +
        'It was still unused after waiting ' + opts.maxTimeToBuffer + 'ms. ' +
        'You can configure this timeout by changing the `maxTimeToBuffer` option.';
      self.fatalIncomingError(e);
    }
  }, opts.maxTimeToBuffer);
}



Upstream.prototype._read = require('./prototype._read');
Upstream.prototype.pipe = require('./prototype.pipe');
Upstream.prototype.upload = require('./prototype.upload');
Upstream.prototype.serializeFiles = require('./prototype.serializeFiles');
Upstream.prototype.writeFile = require('./prototype.writeFile');
Upstream.prototype.fatalIncomingError = require('./prototype.fatalIncomingError');
Upstream.prototype.noMoreFiles = require('./prototype.noMoreFiles');







module.exports = Upstream;
