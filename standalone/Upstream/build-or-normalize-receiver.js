/**
 * Module dependencies
 */

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

  var receiver__;

  // If a receiver instance was passed in as the first argument, use it directly
  if (typeof opts === 'object' && opts.writable) {
    receiver__ = opts;
    return receiver__;
  }

  // If the first argument is undefined, treat it as an empty configuration object.
  else if (typeof opts === 'undefined') {
    opts = {};
  }


  // Now we can normalize our receiver options
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  var receiverOpts = _.cloneDeep(opts);


  // At this point, we know we didn't receive a proper receiver instance, so we should have
  // ended up with a configuration object. Otherwise, this is an error.
  if (typeof receiverOpts !== 'object') {
    var err = new Error('No valid receiver specified!');
    e.code = 'E_USAGE';
    err.usage = USAGE;
    err.toString = function() {
      return err.message + '\nUsage: ' + err.usage + '\n';
    };
    throw err;
  }

  // console.log('receiverOpts:',receiverOpts);

  // Determine the file adapter to use
  // (defaults to `DefaultFileAdapter`, defined above in the module dependencies at the top of this file)
  var Adapter = receiverOpts.adapter || DefaultFileAdapter;

  // Support Adapter as either a function
  // or a verbatim adapter object (pass it in directly)
  if (_.isFunction(Adapter)) {
    Adapter = Adapter(opts);
  }

  // Finally, build a default receiver stream with the specified options
  receiver__ = Adapter.receive(receiverOpts);

  // and return it.
  return receiver__;
};
