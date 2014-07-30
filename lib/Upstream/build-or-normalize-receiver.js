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

  var receiverOpts = {};

  // If a receiver instance was passed in as the first argument, use it directly
  if (typeof receiver__ === 'object' && receiver__.writable) {}

  // If the first argument appears to be a configuration object
  // instantiate a default receiver stream with the specified options and use that.
  else if (typeof receiver__ === 'object') {
    receiver__ = DefaultFileAdapter().receiver(_.cloneDeep(receiver__));
  }

  // If the first argument is a string, treat is as path and use it to build
  // a `saveAs` function.
  else if (typeof receiver__ === 'string') {

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // ???   This doesn't make a whole lot of sense- should probably be /\/$/ instead for trailing slash IMO
    // |||   see `npm:list-directory-contents` for explanation of the convention and cross-OS compat.
    // \_/
    //
    // If the string has a leading `/`, interpret it as an absolute path.
    // i.e. we'll use it to form both the "filename" and "dirname" options.
    if (receiver__.match(/^\//)) {
      receiver__ = DefaultFileAdapter().receiver({
        filename: path.basename(receiver__),
        dirname: path.dirname(receiver__)
      });
    }
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    // Otherwise just use it as the "filename"
    else {
      receiver__ = DefaultFileAdapter().receiver({
        filename: receiver__
      });
    }
  }

  // If it is undefined, save it using the default receiver using a generated
  // filename
  else if (typeof receiver === 'undefined') {
    receiver__ = DefaultFileAdapter().receiver();
  }

  // Otherwise, if it is some unrecognized thing, this is an error
  else {
    var err = new Error('No valid receiver specified!');
    e.code = 'E_USAGE';
    err.usage = USAGE;
    err.toString = function() {
      return err.message + '\nUsage: ' + err.usage + '\n';
    };
    throw err;
  }

  return receiver__;
};
