// todo rip this out


// (set to `true` to display development-only log messages)
FILE_PARSER_LOGGER_ENABLED = true;
require('colors');


module.exports = function () {};
if (global.FILE_PARSER_LOGGER_ENABLED) {
	module.exports = console.log;
}