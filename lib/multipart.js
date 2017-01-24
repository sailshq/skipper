/**
 * Module dependencies
 */

var _ = require('lodash');
var log = require('../standalone/logger');
var Parser = require('./Parser');



/**
 * Parse a multipart HTTP request.
 *
 * @param  {Object|nil} options
 * @return {Middleware}
 */

module.exports = function toParseMultipartHTTPRequest(options) {
  return function _parseMultipartHTTPRequest(req, res, next) {

    //
    // Conventions:
    //  + Any other logic which mutates `req` should go in this file.
    //  + Try not to pass direct access to `req` to other modules (violating this currently)
    //  + Try not to pass direct access to `next` to other modules (violating this currently)
    //

    // If the content type is NOT explicitly set to "multipart/form-data",
    // don't run all this expensive code -- just bail out early.
    if (!req.is('multipart/form-data')) return next();

    // Namespace a property on `req` and instantiate a Parser
    // to put in there.
    var parser = req._fileparser = new Parser(req, options, next);

    // Expose `req.file(...)` method
    req.file = _.bind(parser.acquireUpstream, parser);


    // If parser emits `warning`, also emit it on `req` so it can be captured
    // by your app.  When NODE_ENV != 'production', if `req._sails` exists, this
    // will attempt to log a message to the console using your configured logger.
    // If this doesn't work, it logs a message.  In production, no warnings are emitted.
    if (process.env.NODE_ENV !== 'production') {
      parser.on('warning', function(msg) {
        if (req._sails) {
          try {
            req._sails.log.verbose(msg);
          } catch (e) {}
        } else log.color('yellow').write(msg);
      });
    }

  };
};

