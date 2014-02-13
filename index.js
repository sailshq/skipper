/**
 * Module dependencies
 */

var _ = require('lodash')
	, toParseMultipartHTTPRequest = require('./lib/multipart')
	, express = require('express');



/**
 * file-parser
 */

module.exports = function toParseHTTPBody (options) {

	// Configure body parser components
	var URLEncodedBodyParser = express.urlencoded(options);
	var MultipartBodyParser = toParseMultipartHTTPRequest(options);
	var JSONBodyParser = express.json(options);


	return function _parseHTTPBody(req, res, next) {

		// Optimization: skip bodyParser for GET requests.
		if (req.method.toLowerCase() === 'get') {
			return next();
		}
		
		// TODO: Optimization: skip bodyParser for other HTTP requests w/o a body.
		
		// TODO: Optimization: only run bodyParser if this is a known route
		
		// log.verbose('Running request ('+req.method+' ' + req.url + ') through bodyParser...');

		JSONBodyParser(req, res, function(err) {
			if (err) return next(err);
			URLEncodedBodyParser(req, res, function(err) {
				if (err) return next(err);
				MultipartBodyParser(req, res, function(err) {
					if (err) return next(err);

					// If we were able to parse something at this point
					// (req.body isn't empty) or the content-type is JSON,
					// original body parse must have worked.
					var reqBodyNotEmpty = !_.isEqual(req.body, {});
					var contentTypeIsJSON = (backupContentType === 'application/json');
					if (contentTypeIsJSON || reqBodyNotEmpty) {
						return next();
					}



					/**
					 * OK, here's how the re-run of the JSON bodyparser works:
					 * ========================================================
					 * If the original pass of the bodyParser failed to parse anything, rerun it,
					 * but with an artificial `application/json` content-type header,
					 * forcing it to try and parse the request body as JSON.  This is just in case
					 * the user sent a JSON request body, but forgot to set the appropriate header
					 * (which is pretty much every time, I think.)
					 */

					// Otherwise, set an explicit JSON content-type and try again.
					var backupContentType = req.headers['content-type'];
					req.headers['content-type'] = 'application/json';
					JSONBodyParser(req, res, function(err) {

						// Revert content-type
						req.headers['content-type'] = backupContentType;

						// If an error occurred in the retry, it's not actually an error
						// (we can't assume this was intended to be JSON)
						if (err) {
							// log.verbose('Attempted to retry bodyParse as JSON.  But no luck.', err);
						}

						// Proceed, whether or not the body was parsed.
						next();
					});
				});
			});
		});
	};
};