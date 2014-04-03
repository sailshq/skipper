/**
 * Module dependencies
 */
var fsx = require('fs-extra');
var MultiPartUpload = require('knox-mpu');
var knox = require('knox');
var UUIDGenerator = require('node-uuid');



/**
 * Example of a simple receiver for file-parser.
 * This is used for handling file uploads and writing them
 * to a storage container.
 *
 * This is just a super-basic thing that writes files to S3.
 * It DOES NOT INCLUDE a garbage-collection mechanism for cleaning up
 * file parts which were not successfully uploaded to S3.
 * 
 * @param  {Object} options
 * @return {Stream.Writable}
 */

module.exports = function newReceiverStream(options) {

  // These credentials can be fetched from options:
  var S3_API_KEY = options.apiKey;
  var S3_API_SECRET = options.apiSecret;
  var S3_BUCKET = options.bucket;

  var log = console.log;

  var Writable = require('stream').Writable;
  var receiver__ = Writable({
    objectMode: true
  });
  var client = knox.createClient({
    key: S3_API_KEY,
    secret: S3_API_SECRET,
    bucket: S3_BUCKET
  });

  receiver__._write = function onFile(__newFile, encoding, next) {

    // Create a unique(?) filename
    var fsName = UUIDGenerator.v1();
    log(('Receiver: Received file `' + __newFile.filename + '` from an Upstream.').grey);

    var mpu = new MultiPartUpload({
      client: client,
      objectName: fsName,
      stream: __newFile,
      maxUploadSize: options.maxBytes
    }, function(err, body) {
      if (err) {
        log(('Receiver: Error writing `' + __newFile.filename + '`:: ' + require('util').inspect(err) + ' :: Cancelling upload and cleaning up already-written bytes...').red);
        receiver__.emit('error', err);
        return;
      }
      __newFile.extra = body;
      __newFile.extra.fsName = fsName;

      log(('Receiver: Finished writing `' + __newFile.filename + '`').grey);
      next();
    });

    mpu.on('progress', function(data) {
      receiver__.emit('progress', {
        name: __newFile.filename,
        written: data.written,
        total: data.total,
        percent: data.percent
      });
    });

  };

  return receiver__;
};