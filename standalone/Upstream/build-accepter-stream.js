/**
 * Module dependencies
 */

var _ = require('lodash');
var TransformStream = require('stream').Transform;

/**
 * [exports description]
 * @param  {Object} options    [description]
 * @return {[type]}            [description]
 */
module.exports = function buildRenamerStream(acceptFile, files) {
  if (!acceptFile) {
    acceptFile = function(fileMetadata, callback) {
      return callback(null, true);
    }
  }



  var __accepter__ = new TransformStream({
    objectMode: true
  });

  __accepter__.files = files;
  __accepter__._transform = function(__file, enctype, next) {
    var fileMetadata = {
      filename: __file.filename,
      size: __file.byteCount,
      type: __file.headers['content-type']
    }
    acceptFile(fileMetadata, function(error, shouldPushFile) {
      if (error) {
        __accepter__.emit('error', error);
      }
      if (shouldPushFile) {
        __accepter__.push(__file);
        next();
      }
      else{
        //workaround
        var index = __accepter__.files.indexOf(__file);
        __accepter__.files.splice(index,1);
        __accepter__.push(null);
        next();
      }
      
    })
  };

  return __accepter__;
};