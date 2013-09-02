/**
 * Module dependencies
 */

var inherits	= require('util').inherits,
	Stream		= require('stream'),
	_			= require('lodash');




/**
 * Expose stream constructor
 */

module.exports = NoopStream;




/**
* NoopStream
*
* Fake.  Always ends immediately upon `_resume`
*
* @implements Writable
* @implements Resumeable
* @extends {Stream}
*/

inherits(NoopStream, Stream);
function NoopStream () {
	this.writable = true;
	_.bindAll(this);
}


/**
 * Fake `_resume` call that always calls `end`
 */

NoopStream.prototype._resume = function () {
	this.emit('end');
};