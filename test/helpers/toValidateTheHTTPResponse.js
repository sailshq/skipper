/**
 * Module dependencies
 */

var util = require('util');



/**
 * toValidateTheHTTPResponse
 *
 * @param  {Function} done [description]
 * @return {Function} callback for HTTP request- checks that response is ok
 */

module.exports = function toValidateTheHTTPResponse(done) {
  return function validateHTTPResponse(err, res, body) {
    if (err) return done(err);
    if (res.statusCode >= 300) {
      return done(new Error(util.format('Server responded with %s :: %s', res.statusCode, body)));
    }
    done();
  };
};
