/**
 * Module dependencies
 */

var _ = require('lodash');



/**
 * Extract metadata for this Upstream's files.
 *
 * @return {Array}
 */

module.exports = function serializeFiles() {
  var self = this;

  return _.reduce(self._files, function(memo, file) {

    memo.push(new UploadedFileMetadata({
      // Unique file descriptor:
      fd: file.stream.fd,

      // Conventional bodyParser stuff:
      size: file.stream.byteCount,
      type: file.stream.headers && file.stream.headers['content-type'],

      // Custom stuff:
      filename: file.stream.filename,
      status: file.status,
      field: self.fieldName,
      extra: file.stream.extra,

      // Non-enumerable properties:
      stream: file.stream
    }));

    return memo;
  }, []);
};




/**
 * Simple wrapper class for making the file metadata nicer.
 *
 * @param {Object} metadata
 */
function UploadedFileMetadata(metadata) {

  // Make `this.orm` non-enumerable
  Object.defineProperty(this, 'stream', { enumerable: false, writable: true });

  // Merge in metadata
  _.extend(this, metadata);
}

