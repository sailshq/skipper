/**
 * Module dependencies
 */

var util = require('util');
var path = require('path');
var TransformStream = require('stream').Transform;
var _ = require('@sailshq/lodash');
var debug = require('debug')('skipper');
var UUIDGenerator = require('uuid/v4');


/**
 * [exports description]
 * @param  {Object} options    [description]
 * @return {[type]}            [description]
 */
module.exports = function buildRenamerStream (options) {
  options = options || {};

  var __renamer__ = new TransformStream({objectMode: true});
  __renamer__._transform = function(__file, enctype, next) {

    // Determine the unique file descriptor (`fd`).
    // Represents the location where file should be written in the remote fs.
    (function determineBasename (cb) {
      // Use the `saveAs` string verbatim
      if (_.isString(options.saveAs)) {
        return cb(undefined, options.saveAs);
      }
      // Run the `saveAs` fn to determine the basename
      else if (_.isFunction(options.saveAs)) {
        options.saveAs(__file, function (err, fdFromUserland){
          if (err) { return cb(err); }

          if (!_.isString(fdFromUserland)) {
            return cb(new Error('The `saveAs` function triggered its callback, but did not send back a valid string as the 2nd argument.  Instead, got: '+util.inspect(fdFromUserland, {depth:null})+''));
          }

          return cb(undefined, fdFromUserland);
        });//</saveAs>
      }
      // The default `saveAs` implements a unique filename by combining:
      //  • a generated UUID  (like "4d5f444-38b4-4dc3-b9c3-74cb7fbbc932")
      //  • the uploaded file's original extension (like ".jpg")
      else {
        return cb(undefined, UUIDGenerator()+ path.extname(__file.filename));
      }
    })(function (err, basename) {
      if (err) { return next(err); }

      __file.fd = basename;
      if (_.isString(options.dirname)) {
        __file.fd = path.join(options.dirname, __file.fd);
      }

      debug('RenamerPump:\n• dirname => %s\n• field => %s\n• fd => %s', __file.dirname, __file.field, __file.fd);
      __renamer__.push(__file);
      next();
    });
  };

  return __renamer__;
};
