var _ = require('@sailshq/lodash');


var logger;
if (_.isString(process.env.DEBUG) && process.env.DEBUG.match('skipper')) {
  require('colors');
  logger = function consoleLogger( /* arg0, ..., argN */ ) {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  };
  logger.color = function colorLogger() {
    return {
      write: function () {
        console.log.apply(console,
          _.reduce(Array.prototype.slice.call(arguments), function (m,v) {
            // FUTURE: bring back colors using chalk or better yet just deprecate this because it's not useful
            m.push(v);
            return m;
          }, [])
        );
      }
    };
  };
}
else {
  logger = function noOp() {};
  logger.color = function noOp() { return {write: function noOp(){}}; };
}

module.exports = logger;
