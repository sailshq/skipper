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
    memo.push({
      // Unique file descriptor
      fd: file.stream._skipperFD,

      // Conventional bodyParser stuff:
      size: file.stream.byteCount,
      type: file.stream.headers && file.stream.headers['content-type'],

      // Custom stuff:
      filename: file.stream.filename,
      status: file.status,
      field: self.fieldName,
      extra: file.stream.extra

    });

    return memo;
  }, []);
};

