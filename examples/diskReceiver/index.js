/**
 * Module dependencies
 */

var Writable = require('stream').Writable;
var fsx = require('fs-extra');
var path = require('path');
var _ = require('lodash');



/**
 * Example of a simple receiver for file-parser.
 * This is used for handling file uploads and writing them
 * to a storage container.
 *
 * This is just a super-basic thing that writes files to disk.
 * It does include a garbage-collection mechanism for file uploads
 * which were not successful.
 *
 * @return {Stream.Writable}
 */

module.exports = function newReceiverStream(options) {
  options = options || {};
  _.defaults(options, {

    // By default, create new files on disk
    // using their uploaded filenames.
    // (no overwrite-checking is performed!!)
    getFilename: function (__newFile) {
      return __newFile.filename;
    },

    // By default, upload files to `./.tmp/uploads` (relative to cwd)
    dirname: '.tmp/uploads'
  });

  var receiver__ = Writable({
    objectMode: true
  });

  // This `_write` method is invoked each time a new file is received
  // from the Readable stream (Upstream) which is pumping filestreams
  // into this receiver.  (filename === `__newFile.filename`).
  receiver__._write = function onFile(__newFile, encoding, done) {

    // Determine location where file should be written
    var dirPath = path.resolve(options.dirname);
    var filename = options.getFilename(__newFile);
    var filePath = path.join(dirPath, filename);

    // Garbage-collect the bytes that were already written for this file.
    // (called when a read or write error occurs)
    function gc(err) {
      // console.log('************** Garbage collecting file `' + __newFile.filename + '` located @ ' + filePath + '...');
      fsx.unlink(filePath, function(gcErr) {
        if (gcErr) return done([err].concat([gcErr]));
        return done(err);
      });
    }

    // Ensure necessary parent directories exist:
    fsx.mkdirs(dirPath, function (err) {
      if (err) { /* ignore mkdir error */ }
      
      var outs = fsx.createWriteStream(filePath, encoding);
      __newFile.pipe(outs);



      __newFile.on('error', function(err) {
        // console.log('***** READ error on file ' + __newFile.filename, '::', err);
      });
      outs.on('error', function failedToWriteFile(err) {
        // console.log('Error on output stream- garbage collecting unfinished uploads...');
        gc(err);
      });

      outs.on('finish', function successfullyWroteFile() {
        done();
      });
    });

  };

  return receiver__;
};
