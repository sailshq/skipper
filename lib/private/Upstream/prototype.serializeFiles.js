/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');



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
      fd: file.stream.skipperFd || (_.isString(file.stream.fd) ? file.stream.fd : undefined),

      // File size.
      // Multiparty will attempt to set this to the value of a part's
      // `content-length` header if such a header exists, but adapters
      // should override this by setting `byteCount` to the size of the
      // persisted file to ensure accuracy.
      size: file.stream.byteCount,

      // Conventional bodyParser stuff:
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

