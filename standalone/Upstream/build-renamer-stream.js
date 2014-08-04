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
      console.log('RENAMING __file IN RENAMER PUMP ON FIELD '+__file.field,'to:',__file.fd);
      __renamer__.push(__file);
      next();
    });
  };

  return __renamer__;
};






// // Run `saveAs` to get the desired name for the file
// options.saveAs(__newFile, function (err, filename){
//   if (err) return done(err);

//   if (options.fd) {
//     fd = path.resolve(options.fd);
//   }
//   else fd = path.join(dirPath, filename);

//   // Attach fd as metadata to the file stream for use back in skipper core
//   __newFile._skipperFD = fd;

//   // Generate a progress stream and unique id for this file
//   // then pipe the bytes down to the outs___ stream
//   // We will pipe the incoming file stream to this, which will
//   var localID = _.uniqueId();
//   var guessedTotal = 0;
//   var writtenSoFar = 0;
//   var __progress__ = new TransformStream();
//   __progress__._transform = function(chunk, enctype, next) {

//     // Update the guessedTotal to make % estimate
//     // more accurate:
//     guessedTotal += chunk.length;
//     writtenSoFar += chunk.length;

//     // Do the actual "writing", which in our case will pipe
//     // the bytes to the outs___ stream that writes to disk
//     this.push(chunk);

//     // Emit an event that will calculate our total upload
//     // progress and determine whether we're within quota
//     this.emit('progress', {
//       id: localID,
//       fd: __newFile._skipperFD,
//       name: __newFile.name,
//       written: writtenSoFar,
//       total: guessedTotal,
//       percent: (writtenSoFar / guessedTotal) * 100 | 0
//     });
//     next();
//   };

//   // This event is fired when a single file stream emits a progress event.
//   // Each time we receive a file, we must recalculate the TOTAL progress
//   // for the aggregate file upload.
//   //
//   // events emitted look like:
//   /*
//   {
//     percentage: 9.05,
//     transferred: 949624,
//     length: 10485760,
//     remaining: 9536136,
//     eta: 10,
//     runtime: 0,
//     delta: 295396,
//     speed: 949624
//   }
//   */
//   __progress__.on('progress', function singleFileProgress(milestone) {

//     // Lookup or create new object to track file progress
//     var currentFileProgress = _.find(receiver__._files, {
//       id: localID
//     });
//     if (currentFileProgress) {
//       currentFileProgress.written = milestone.written;
//       currentFileProgress.total = milestone.total;
//       currentFileProgress.percent = milestone.percent;
//       currentFileProgress.stream = __newFile;
//     } else {
//       currentFileProgress = {
//         id: localID,
//         fd: __newFile._skipperFD,
//         name: __newFile.filename,
//         written: milestone.written,
//         total: milestone.total,
//         percent: milestone.percent,
//         stream: __newFile
//       };
//       receiver__._files.push(currentFileProgress);
//     }
//     ////////////////////////////////////////////////////////////////


//     // Recalculate `totalBytesWritten` so far for this receiver instance
//     // (across ALL OF ITS FILES)
//     // using the sum of all bytes written to each file in `receiver__._files`
//     totalBytesWritten = _.reduce(receiver__._files, function(memo, status) {
//       memo += status.written;
//       return memo;
//     }, 0);

//     log(currentFileProgress.percent, '::', currentFileProgress.written, '/', currentFileProgress.total, '       (file #' + currentFileProgress.id + '   :: ' + /*'update#'+counter*/ '' + ')'); //receiver__._files.length+' files)');

//     // Emit an event on the receiver.  Someone using Skipper may listen for this to show
//     // a progress bar, for example.
//     receiver__.emit('progress', currentFileProgress);

//     // and then enforce its `maxBytes`.
//     if (options.maxBytes && totalBytesWritten >= options.maxBytes) {

//       var err = new Error();
//       err.code = 'E_EXCEEDS_UPLOAD_LIMIT';
//       err.name = 'Upload Error';
//       err.maxBytes = options.maxBytes;
//       err.written = totalBytesWritten;
//       err.message = 'Upload limit of ' + err.maxBytes + ' bytes exceeded (' + err.written + ' bytes written)';

//       // Stop listening for progress events
//       __progress__.removeAllListeners('progress');
//       // Unpipe the progress stream, which feeds the disk stream, so we don't keep dumping to disk
//       __progress__.unpipe();
//       // Clean up any files we've already written
//       (function gc(err) {
//       // Garbage-collects the bytes that were already written for this file.
//       // (called when a read or write error occurs)
//         log('************** Garbage collecting file `' + __newFile.filename + '` located @ ' + fd + '...');
//         adapter.rm(fd, function(gcErr) {
//           if (gcErr) return outs__.emit('E_EXCEEDS_UPLOAD_LIMIT',[err].concat([gcErr]));
//           return outs__.emit('E_EXCEEDS_UPLOAD_LIMIT',err);
//         });
//       })(err);

//       return;

//       // Don't do this--it releases the underlying pipes, which confuses node when it's in the middle
//       // of a write operation.
//       // outs__.emit('error', err);
//       //
//       //
//     }

//   });

//   return __progress__;
// };





  // // Not sure if this belongs here, but....
  // //////////////////////////////////////////////////

  // // Wait until the upstream has ended, errored, or been connected
  // // (whichever comes first-- one of those states is guaranteed to occur)
  // var isReadyToProceed;
  // self.once('end', function (){
  //   isReadyToProceed = true;
  // });
  // self.once('error', function (){
  //   isReadyToProceed = true;
  // });
  // async.until(function untilConnected(){
  //   isReadyToProceed =
  //     isReadyToProceed ||
  //     (self._connected && self._receiver);
  //   return isReadyToProceed;
  // }, function keepChecking(cb){
  //   setTimeout(cb, 15);
  // }, function thenFinally(err){
  //   if (err) { /* err not possible */ }
  //   console.log('CONNECTED to '+self.fieldName+'!');//,self._receiver);

  //   // Determine the `fd` for the file.
  //   //
  //   // But first wait until the upstream has been connected to a
  //   // receiver. We won't be able to access the `saveAs` option
  //   // until then!
  //   //
  //   // (run the `saveAs` method, or if it's a string, just use it)
  //   // ...

  // });
  // //////////////////////////////////////////////////


  // ////////////////////////////////////////////////////////////////////////////////
  // // OK- so this can't be here. We need to go ahead and connect the pipe.
  // // I get that we can't start writing until we have an answer about the fd
  // // from the saveAs() method, but we should manage that by applying backpressure.
  // // ~Mike (Sunday Aug 3, 2014)
  // //
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
  // //
  // // // Call saveAs-Function on the receiver
  // // receiver__.saveAs(receiver__.filename, function generateNameFinish(err) {
  // //   if (err) {
  // //     return cb(err);
  // //   }

  // //   // Pipe to the (Writeable) receiver.  Every time the file parser encounters a new file
  // //   // on this stream (i.e. a new file in the same form field), it will call Upstream's
  // //   // writeFile method, which will push the new file stream into Upstream's buffer.  The
  // //   // piping mechanism will then cause "_write" to be called on the Receiver, so it can
  // //   // handle the file in whatever way it sees fit (saving to disk, streaming to S3, etc.)
  // //   return self.pipe(receiver__);
  // // });
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
  // // // ??????????????????????????????????????????????????????????????????????????????????????????
