/**
 * Module dependencies
 */

var _ = require('lodash')

	, Upstream = require('../Upstream')
	, applyDefaultOptions = require('./defaults')
	, STRINGFILE = require('../../stringfile.js');



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


/**
 * Parse an incoming multipart request.
 */

Parser.prototype.parse = require('./parse');


/**
 * Receive a file.
 * @param  {stream.Readable} part			[a file from one of the fields in the multipart upload]
 */
Parser.prototype.onFile = function ( part ) {

	// todo: handle files
	console.log('multiparty discovered file ::',part.filename,'on field ::', part.name);

	// Acquire Upstream for this field
	// (one may or may not already exist)
	var up = this.acquireUpstream(part.name);
	up.writeFile(part);
};



/**
 * [onTextParam description]
 * @param  {[type]} field [description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
Parser.prototype.onTextParam = function (field, value) {

	// After control has been relinquished, any fields received should be ignored
	// since they are not guaranteed to exist in `req.body` when app code runs.
	// Any time this happens, we'll emit a warning to the `req`:
	this.req.emit('warning', STRINGFILE.get('warning.paramArrivedTooLate', [field, field]));

	if (this.req.body[field]) {
		// `req.body` already contains `field`
		// This should never happen...
		// ...but if it does, leave the old value alone.
		return;
	}

	this.req.body[field] = value;
	console.log('multiparty discovered field ', '`'+field+'`','::',this.req.body[field]);
};



/**
 * Find the upstream with `fieldName`, or
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
	

	var newUpstream = new Upstream();
	this.upstreams.push(newUpstream);
	return newUpstream;
};



module.exports = Parser;
