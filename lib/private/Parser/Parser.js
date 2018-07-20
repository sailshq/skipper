/**
 * Module dependencies
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var applyDefaultOptions = require('./defaults');



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

  // Tracks Upstreams generated during this request.
  this.upstreams = [];

  // Tracks text params which have been received during this request.
  // They may or may not have finished yet, as indicated by the `done`
  // key on each object.  `stream` is the raw partstream from the multipart
  // HTTP request.
  this.textParams = [ /* {}, {} */ ];

  this.parseReq();
}
util.inherits(Parser, EventEmitter);


/**
 * Parse an incoming multipart request.
 */

Parser.prototype.parseReq = require('./prototype.parseReq');

Parser.prototype.onFile = require('./prototype.onFile');

Parser.prototype.onTextParam = require('./prototype.onTextParam');

Parser.prototype.acquireUpstream = require('./prototype.acquireUpstream');


module.exports = Parser;
