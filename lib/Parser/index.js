/**
 * Module dependencies
 */

var _ = require('lodash')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter
	
	, log = require('../logger')
	, Upstream = require('../Upstream')
	, applyDefaultOptions = require('./defaults');



/**
 * Parser
 *
 * constructor
 * 
 * @param {[type]} req     [description]
 * @param {[type]} options [description]
 * @param {Function} next
 */

function Parser(req, options, next) {

	this.req = req;
	this.next = next;
	this.options = options = applyDefaultOptions(options);
	this.upstreams = [];

	//
	// Note: `this.upstreams` tracks upload streams generated
	// during this request.
	//

	this.parse();
}
util.inherits(Parser, EventEmitter);


/**
 * Parse an incoming multipart request.
 */

Parser.prototype.parse = require('./parse');

Parser.prototype.onFile = require('./onFile');

Parser.prototype.onTextParam = require('./onTextParam');



/**
 * Find the Upstream with `fieldName`, or
 * create and save it for the first time if necessary.
 * (Takes care of managing the collection of upstreams.)
 * 
 * @param  {String} fieldName
 * @return {Upstream}
 */
Parser.prototype.acquireUpstream = function ( fieldName ) {

	var existingStream = _.find(this.upstreams, {
		fieldName: fieldName
	});
	if (existingStream) return existingStream;
	

	// Instantiate a new Upstream, and save the fieldName for it.
	var newUpstream = new Upstream();
	log(('Acquiring new Upstream for field `'+fieldName+'`').grey);
	newUpstream.fieldName = fieldName;
	this.upstreams.push(newUpstream);


	// If the new Upstream ever emits an 'error' event ("READ" error),
	var self = this;
	newUpstream.on('error', function (err) {

		// terminate the request early (call `next(err)`)
		if (! self._hasPassedControlToApp ) {
			self._hasPassedControlToApp = true;
			log('Error occurred in form before control was passed.  Passing control to app error handler...'.red);
			return self.next(err);
		}

		// TODO:
		// UNLESS control has already been passed!!
		// 
		// If it has, and the upstream is already hooked up to one or more receivers,
		// in which case we should let each of the receiver[s] (write stream[s])
		// handle the error however they see fit:
		// if (!newUpstream.connectedTo || !newUpstream.connectedTo.length) {
			// _.each(newUpstream.connectedTo, function eachReceiver(outs) {
			//   outs.emit('error', err);
			// });
			// return;
		// }

		
		// if control has been passed, but nothing has been hooked up yet,
		// we can't really do anything particularly helpful.
		// We'll log a warning.
		// (this is all to keep from throwing and crashing the app)
		self.emit('warning', String(err));
		return;

	});


	return newUpstream;

};



module.exports = Parser;

