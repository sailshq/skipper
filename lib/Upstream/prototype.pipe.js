/**
 * Module dependencies
 */

var Readable = require('stream').Readable;



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

module.exports = function pipe () {
  this._connected = true;
  return Readable.prototype.pipe.apply(this, Array.prototype.slice.call(arguments));
};
