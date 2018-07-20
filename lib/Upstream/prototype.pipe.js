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

module.exports = function pipe ( /* destination, [options] */) {
  var self = this;

  self._connected = true;
  self._receiver = arguments[0];
  self.once('end', function (){
    self._emittedEnd = true;
  });
  self.once('error', function (){
    self._emittedError = true;
  });
  return Readable.prototype.pipe.apply(self, Array.prototype.slice.call(arguments));
};
