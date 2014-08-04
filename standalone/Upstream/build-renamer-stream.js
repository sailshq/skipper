/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');
var TransformStream = require('stream').Transform;
var UUIDGenerator = require('node-uuid');


/**
 * [exports description]
 * @param  {Object} options    [description]
 * @return {[type]}            [description]
 */
module.exports = function buildRenamerStream (options) {
  options = options || {};
  var log = options.log || function noOpLog(){};

  var __renamer__ = new TransformStream({objectMode: true});
  __renamer__._transform = function(__file, enctype, next) {

    // Determine the unique file descriptor (`fd`).
    // Represents the location where file should be written in the remote fs.
    (function determineBasename (cb) {
      // Use the `saveAs` string verbatim
      if (_.isString(options.saveAs)) {
        return cb(null, options.saveAs);
      }
      // Run the `saveAs` fn to determine the basename
      else if (_.isFunction(options.saveAs)) {
        options.saveAs(__file, cb);
      }
      // The default `saveAs` implements a unique filename by combining:
      //  • a generated UUID  (like "4d5f444-38b4-4dc3-b9c3-74cb7fbbc932")
      //  • the uploaded file's original extension (like ".jpg")
      else {
        return cb(null, UUIDGenerator.v4()+ path.extname(__file.filename));
      }
    })(function (err, basename) {
      if (err) return next(err);

      __file.fd = basename;
      if (_.isString(options.dirname)) {
        __file.fd = path.join(options.dirname, __file.fd);
      }

      log.color('blue').write('RenamerPump:\n• dirname => %s\n• field => %s\n• fd => %s', __file.dirname, __file.field,__file.fd);
      __renamer__.push(__file);
      next();
    });
  };

  return __renamer__;
};
