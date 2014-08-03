/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');
var DefaultFileAdapter = require('skipper-disk');




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


  // Handle first argument when it's specified as string
  // (save it as the `saveAs` opt)
  if (typeof receiver__ === 'string') {
    receiver__ = { saveAs: receiver__ };
  }

  // If the first argument is undefined, treat it as an empty configuration object.
  else if (typeof receiver__ === 'undefined') {
    receiver__ = {};
  }


  // Now we can normalize our receiver options
  //////////////////////////////////////////////////////////////////////////////////////////////////////
  var receiverOpts = _.cloneDeep(receiver__);

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

    // If the string has a leading `/`, interpret it as an absolute path.
    // In that case, we'll infer a value for the "dirname" option.
    if (!!receiverOpts.saveAs.match(/^\//)) {
      receiverOpts.dirname = receiverOpts.dirname || path.dirname(receiverOpts.saveAs);
      receiverOpts.saveAs = path.basename(receiverOpts.saveAs);
    }
    // And in any case, we'll normalize "saveAs" to a function
    var desiredFilename = receiverOpts.saveAs;
    receiverOpts.saveAs = function (__newFile, cb) {
      cb(null, desiredFilename);
    };
  }

  // Finally, build a default receiver stream with the specified options
  receiver__ = FileAdapter().receive(receiverOpts);

  // and return it.
  return receiver__;
};
