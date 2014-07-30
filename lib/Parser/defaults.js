/**
 * Module dependencies
 */

var _ = require('lodash');



module.exports = function(options) {

  // Apply defaults
  options = options || {};
  _.defaults(options, {

    // maxWaitTime is the maximum # of ms to wait for the first file
    maxWaitTime: 50,

    // maxBufferTime is the maximum # of ms to wait for an UploadStream
    // to be plugged in to something (i.e. buffering the incoming bytes)
    // before dropping it.
    // (this can probably be replaced with `highWaterMark` and `lowWaterMark`
    // in streams2)
    maxBufferTime: 250

  });

  return options;
};
