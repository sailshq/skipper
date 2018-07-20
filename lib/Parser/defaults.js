/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');



module.exports = function(options) {

  // Apply defaults
  options = options || {};
  _.defaults(options, {

    // maxWaitTime is the maximum # of ms to wait for the first file
    // if the request finishes before this number of ms (i.e. the form emits "close")
    // then there is no problem.  Otherwise, a fatal ETIMEOUT error will fire.
    maxTimeToWaitForFirstFile: 10000,

    // maxBufferTime is the maximum # of ms to wait for an UploadStream
    // to be plugged in to something (i.e. buffering the incoming bytes)
    // before dropping it.
    // (this can probably be replaced with `highWaterMark` and `lowWaterMark`
    // in streams2)
    maxTimeToBuffer: 4500,

    // maxWaitTimeBeforePassingControlToApp is the maximum # of ms to wait for
    // either a) a file to be encountered or b) the entire request body to be parsed,
    // before turning control back over to the caller (e.g. a Sails controller).
    // For SSL servers, it may be necessary to increase this value
    // (see https://github.com/balderdashy/skipper/issues/71#issuecomment-217556631)
    maxWaitTimeBeforePassingControlToApp: 500

  });

  return options;
};
