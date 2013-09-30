/**
 * Sails-compatible Logger
 *
 * Use `log`, if provided.
 * Then fall back to global `sails.log[.*]()`, if available.
 * Finally, default to `console.log[.*]()`
 */
module.exports = function Logger (log) {

	if (typeof log !== 'undefined') return log;
	if (typeof sails !== 'undefined') return sails.log;
		
	// Build comatible fallback logger
	log = getLogger('log');
	log.info = getLogger('log');
	log.debug = getLogger('log');
	log.verbose = function() {};
	log.warn = getLogger('warn');
	log.error = getLogger('error');

	// Based on console
	function getLogger (type) {
		return function consoleLog () {
			var args = Array.prototype.slice.call(arguments);
			console[type].apply(console, args);
		};
	}

	return log;
};
