/**
 * Module dependencies
 */

var _ = require('lodash');
var log = require('../logger');



/**
 * Extract metadata for this Upstream's files.
 *
 * @return {Array}
 */

module.exports = function serializeFiles() {
  var self = this;

  return _.reduce(self._files, function(memo, file) {
    memo.push({
      id: (function (){

        //////////////////////////////////////////////////
        // ||
        // \/
        // TODO: local filesystem overwrite check
        // /\
        // ||
        //////////////////////////////////////////////////

        // Check if uploaded file should use the `writeFilename` filename
        if (file.stream.writeFilename !== undefined) {
          return file.stream.writeFilename;
        }
        // Otherwise just the original filename
        return file.stream.filenae;

      })(),

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

