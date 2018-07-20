var _ = require('@sailshq/lodash');

// todo rip this out (use the debug module)


// (set to `true` to display development-only log messages)
FILE_PARSER_LOGGER_ENABLED = (_.isString(process.env.DEBUG) && process.env.DEBUG.match('skipper'));

var logger;
if (global.FILE_PARSER_LOGGER_ENABLED) {
  require('colors');
  logger = function consoleLogger( /* arg0, ..., argN */ ) {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  };
  logger.color = function colorLogger( color ) {
    return {
      write: function () {
        console.log.apply(console,
          _.reduce(Array.prototype.slice.call(arguments), function (m,v) {
            try {
              // FUTURE: bring back colors using chalk or better yet just deprecate this because it's not useful
              m.push(v);
            }
            catch(e) { m.push(v); }
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
