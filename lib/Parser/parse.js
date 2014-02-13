/**
 * Module dependencies
 */

var _ = require('lodash')
	, async = require('async')
	, multiparty = require('multiparty');



/**
 * Begin parsing an incoming HTTP request (`this.req`).
 * 
 * @return {[type]} [description]
 */

module.exports = function parseRequest () {

	// Fires up 'ole multiparty
	var form = new multiparty.Form();
	form.parse(this.req);
	form.on('field', _.bind(this.onTextParam, this));


	/**
	 * Receive/handle a new field in the multipart upload.
	 * @param  {stream.Readable} part
	 */
	form.on('part', _.bind(function ( part ) {
		
		// Let the `.on('field') handler take care of non-files.
		if ( !part.filename ) return;

		// Custom handler for fields w/ files
		this.onFile(part);
	}, this));



	var self = this;
	form.on('error', function (err) {
		//
		// Only one 'error' event can ever be emitted, and if an 'error' event
		// is emitted, then 'close' will NOT be emitted.
		//
		console.log('*** multiparty emitted `error`');
		//
		// todo:
		// make sure all subsequent uploads are aborted
		// (since this is a global fatal error)
		// 

		// Emits error on all live Upstreams in this request.
		_(self.upstreams).each(function (up) {
			up.fatalIncomingError(err);
		});
	});

	form.on('close', function () {
		console.log('multiparty emitted `close`');

		// Ends all live Upstreams in this request.
		_(self.upstreams).each(function (up) {
			up.endFiles();
		});
	});

	form.on('progress', function () {
		// console.log('* multiparty emitted `progress`::',arguments);
	});





	// Wait to pass control to the app until one of the following is true:
	// (careful! no error allowed!)
	async.any([
		
		// (1)
		// As soon as request body has been completely parsed.
		function requestBodyCompletelyParsed ( done ) {
			form.on('close', function () {
				done(true);
			});
		},

		// (2)
		// As soon as at least one file is received on any Upstream.
		function receivedFirstFileOfRequest ( done ) {

			// TODO: Implement this properly
			setTimeout(function temporary () {
				console.log('SHOULD NEVER FIRE');
				done(true);
			}, 1000);
		},

		// (3)
		// If no files have been received by the time
		// `maxTimeBeforeImpatient`ms have elapsed,
		// go ahead and proceed.
		function impatient ( done ) {
			var maxTimeBeforeImpatient = 50;
			setTimeout(function () {
				done();
			}, maxTimeBeforeImpatient);
		}

	],
	function iterator (guard, done) { guard(done); },
	_.bind(function passControlToApp () {

		//
		// Careful: No error allowed!
		//

		console.log('Passing control to app...');
		this.next();
	}, this));
};
