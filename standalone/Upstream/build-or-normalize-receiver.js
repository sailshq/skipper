var path = require('path');
var _ = require('lodash');
var DefaultFileAdapter = require('skipper-disk');

/**
 * [buildOrNormalizeReceiver description]
 * @param  {[type]} opts [description]
 * @return {[type]}            [description]
 * @api private
 */
module.exports = function buildOrNormalizeReceiver (opts) {

  var receiver;

  // If a receiver instance was passed in as the first argument, use it directly
  if (typeof opts === 'object' && opts.writable) {
    receiver = opts;
    return receiver;
  }

  // If the first argument is undefined, treat it as an empty configuration object.
  else if (typeof opts === 'undefined') {
    opts = {};
  }


  // Now we can normalize our receiver options
  //////////////////////////////////////////////////////////////////////////////////////////////////////

  // At this point, we know we didn't receive a proper receiver instance, so we should have
  // ended up with a configuration object. Otherwise, this is an error.
  if (typeof opts !== 'object') {
    var err = new Error('No valid receiver specified!');
    e.code = 'E_USAGE';
    err.usage = USAGE;
    err.toString = function() {
      return err.message + '\nUsage: ' + err.usage + '\n';
    };
    throw err;
  }

  // Determine the file adapter to use
  // (defaults to `DefaultFileAdapter`, defined above in the module dependencies at the top of this file)
  var Adapter = opts.adapter || DefaultFileAdapter;

  // Support Adapter as either a function
  // or a verbatim adapter object (pass it in directly)
  if (_.isFunction(Adapter)) {
    Adapter = Adapter(opts);
  }

  // Finally, build a default receiver stream with the specified options
  receiver = Adapter.receive(opts);

  // and return it.
  return receiver;
};
