

/**
 * Sails/Express action that simply sends a 200 response.
 * It does, however, wait for `DELAY` ms if `req.__FILE_PARSER_TESTS__DELAY`
 * is set.  (Useful for simulating app logic/policies that might delay an
 * incoming Upstream being plugged into a receiver.)
 *
 * @param  {Request} req
 * @param  {Response} res
 *
 */

module.exports = function (req, res) {
	var DELAY = req.__FILE_PARSER_TESTS__DELAY;
	if (DELAY) setTimeout(function (){
		res.send(200);
	}, DELAY);
	else res.send(200);
};

