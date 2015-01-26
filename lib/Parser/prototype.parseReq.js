/**
 * Module dependencies
 */

var _ = require('lodash');
var async = require('async');
var Form = require('multiparty').Form;
var log = require('../../standalone/logger');
var STRINGFILE = require('../../stringfile');
var debug = require('debug')('skipper');


/**
 * Begin parsing an incoming HTTP request (`this.req`).
 */

module.exports = function parseReq() {
  var self = this;


  // Save reference to `form` instance.
  var form = this.form = new Form();


  /**
   * Receive/handle a new `part` stream from a field in the multipart upload.
   * @param  {stream.Readable} part
   */
  form.on('part', _.bind(function(part) {

    // Take care of text parameters (i.e. non-files)
    if (!part.filename) {
      this.onTextParam(part);
      return;
    }

    // Custom handler for fields w/ files
    this.onFile(part);
  }, this));



  // Only one 'error' event can ever be emitted, and if an 'error' event
  // is emitted, then 'close' will NOT be emitted.
  form.on('error', function(err) {

    debug('multiparty form emitted error:',err);

    // Emits error on any already-live Upstreams in this request.
    _(self.upstreams).each(function(up) {
      up.fatalIncomingError(err);
    });

    // Flag Parser instance with an error
    self._multipartyError = err||true;

    // // Stop accepting form stuff.
    // // (no more new incoming files/textparams)
    // self.closed = true;

    // // // Informs all Upstreams in this request
    // // // that no more files will be sent.
    // // _(self.upstreams).each(function(up) {
    // //   up.noMoreFiles();
  });


  // Emitted after all parts have been parsed and emitted. Not emitted if an
  // `error` event is emitted.
  form.on('close', function() {
    log((STRINGFILE.get('parser.form.onClose')).grey);
    debug('multiparty form closed.');

    // Flag this request as closed
    // (no more new incoming files/textparams)
    self.closed = true;

    // Informs all Upstreams in this request
    // that no more files will be sent.
    _(self.upstreams).each(function(up) {
      up.noMoreFiles();
    });

    // Uncomment this (and comment out the `noMoreFiles` business above)
    // to simulate an error for testing purposes:
    // up.fatalIncomingError('whee');
  });



  // Set up 3 conditions under which this Parser will pass control
  // to app-level code (i.e. call next())
  // ONLY ONE of the following must be satisfied to continue onward.
  // (careful! no error allowed in callbacks!)
  var timer;
  var whichGuard;
  async.any([

      // (1)
      // As soon as request body has been completely parsed.
      function requestBodyCompletelyParsed(done) {
        form.once('close', function() {
          if (!whichGuard){
            debug('passed control to app because the request "form" closed (there probably weren\'t any file uploads on this upstream)');
            whichGuard = 'requestBodyCompletelyParsed';
          }
          done(true);
        });
      },

      // (2)
      // As soon as at least one file is received on any Upstream.
      function receivedFirstFileOfRequest(done) {
        self.once('firstFile', function() {
          if (!whichGuard){
            debug('passed control to app because first file was received');
            whichGuard = 'receivedFirstFileOfRequest';
          }
          done(true);
        });
      },

      // (3)
      // If no files have been received by the time
      // `maxWaitTimeBeforePassingControlToApp`ms have elapsed,
      // go ahead and proceed.
      function impatient(done) {
        // Note that this is different than "maxTimeToWaitForFirstFile" and "maxTimeToBuffer"-
        // rather, this is just the max number of ms that Skipper will wait before passing control
        // from the body parser (i.e. calling next()).
        //
        // It is deliberately not configurable for now, since it's not really
        var maxWaitTimeBeforePassingControlToApp = 50;
        timer = setTimeout(function() {
          if (!whichGuard){
            debug('passed control to app because 50ms elapsed');
            whichGuard = 'impatient';
          }
          done(true);
        }, maxWaitTimeBeforePassingControlToApp);
      }

    ],
    function iterator(guard, done) {
      // `guard` is one of the three functions above
      guard(done);
    },

    // ****************************************************************
    // Important:  Before moving on, there is one last consideration:
    //
    // We must also wait until all the chunks for every textparam
    // detected before the first file has been received?
    // This is mostly relevant for files which are extremely small
    // compared to their preceding text parameters.
    //
    function finally_waitForTextParams() {
      // Careful: No error argument allowed in this callback!

      debug('waiting for any text params');

      // Make sure the `impatient` timeout fires no more than once
      clearTimeout(timer);

      // Take a look at all currently known text params for this Upstream,
      // then wait until all of them have been read.
      var ms = 5;
      var numTries = 0;
      async.doUntil(
        function setTimer(cb) {


          // Catch-all timeout, just in case something goes awry.
          // Should never happen, but a good failsafe to prevent holding on to
          // control forever.  It this timeout was to fire, we should error out and
          // cancel things.
          numTries++;
          if (numTries > 10) {
            return cb(new Error(
              'EUNFNTEX: Timed out waiting for known text parameters to finish ' +
              'streaming their bytes into the server.'
            ));
          }

          setTimeout(cb, ms);

          // Exponential backoff
          // (multiply ms by 2 each time, up to 500)
          ms = ms < 500 ? ms * 2 : ms;

        },
        function checkIfAllDetectedTextParamsAreDone() {
          return _(self.textParams).all({
            done: true
          });
        },
        function passControlToApp(err) {

          // If an error occurs, run the app's error handler.
          if (err) return self.next(err);

          // At last, pass control to the app.
          if (!self._hasPassedControlToApp) {
            debug('Passing control to app...'.green);
            self._hasPassedControlToApp = true;
            self.next();
          }
        }
      );

    });



  // Lastly, start parsing the incoming multipart upload request.
  form.parse(this.req);
};
