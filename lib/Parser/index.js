/**
 * Module dependencies
 */

var _ = require('lodash')
	, util = require('util')
	, EventEmitter = require('events').EventEmitter

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
	newUpstream.fieldName = fieldName;
	this.upstreams.push(newUpstream);
	return newUpstream;
};



module.exports = Parser;

