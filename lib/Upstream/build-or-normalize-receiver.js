/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');
var DefaultFileAdapter = require('skipper-disk');
var log = require('../logger');




/**
 * [buildOrNormalizeReceiver description]
 * @param  {[type]} receiver__ [description]
 * @return {[type]}            [description]
 * @api private
 */

module.exports = function buildOrNormalizeReceiver (receiver__) {


  // If a receiver instance was passed in as the first argument, use it directly
  if (typeof receiver__ === 'object' && receiver__.writable) {
    return receiver__;
  }


  // If the first argument is a string, treat is as path and use it to build
  // a `saveAs` function.
  if (typeof receiver__ === 'string') {
    var desiredFilename = receiver__;
    receiver__ = {
      saveAs: desiredFilename
    };
  }

  // If the first argument is undefined, treat it as an empty configuration object.
  else if (typeof receiver === 'undefined') {
    receiver__ = {};
  }


  // Now we can normalize our receiver options
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  var receiverOpts = _.cloneDeep(__receiver);

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

  // Determine the file adapter to use
  // (defaults to `DefaultFileAdapter`, defined above in the module dependencies at the top of this file)
  var FileAdapter = receiverOpts.adapter || DefaultFileAdapter;

  // Handle `saveAs` when it's specified as string (normalize to fn)
  if (typeof receiverOpts.saveAs === 'string') {
    // If the string has a trailing `/`, interpret it as a directory path.
    // i.e. we'll use it to form the "dirname" option.
    if (!!receiverOpts.saveAs.match(/\/$/)) {
      receiverOpts.dirname = path.dirname(receiverOpts.saveAs);
    }
    // And in any case, use it to determine the "filename" option.
    receiverOpts.filename = path.basename(receiverOpts.saveAs);
  }

  // Finally, build a default receiver stream with the specified options
  receiver__ = FileAdapter().receive(receiverOpts);

  // and return it.
  return receiver__;
};
