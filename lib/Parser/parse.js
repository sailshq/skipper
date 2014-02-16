/**
 * Module dependencies
 */

var _ = require('lodash')
	, async = require('async')
	, Form = require('./form');



/**
 * Begin parsing an incoming HTTP request (`this.req`).
 */

module.exports = function parseRequest () {


	// Save reference to `form` instance.
	var form = this.form = Form();


	/**
	 * Receive/handle a new text field in the multipart upload.
	 */
	// form.on('field', _.bind(this.onTextParam, this));


	/**
	 * Receive/handle a new `part` stream from a field in the multipart upload.
	 * @param  {stream.Readable} part
	 */
	form.on('part', _.bind(function ( part ) {

		// TODO: strip this out
		require('colors');
		
		// Take care of text parameters (i.e. non-files)
		if ( !part.filename ) {
			console.log('DETECTED TEXTPARAM PART'.grey);
			this.onTextParam(part);
			return;
		}

		console.log('DETECTED FILE PART'.grey);

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
		console.log('Form: emitted `close`');

		// Informs all Upstreams in this request
		// that no more files will be sent.
		_(self.upstreams).each(function (up) {
			up.noMoreFiles();

			// Uncomment this (and comment out `noMoreFiles`) to simulate an error
			// for testing purposes:
			// up.fatalIncomingError('whee');
		});
	});

	form.on('progress', function () {
		// console.log('* multiparty emitted `progress`::',arguments);
	});





	// Set up 3 conditions which will pass control to app-level code (i.e. call next())
	// ONLY ONE of the following must be satisfied to continue onward.
	// (careful! no error allowed in callbacks!)
	var timer;
	async.any([
		
		// (1)
		// As soon as request body has been completely parsed.
		function requestBodyCompletelyParsed ( done ) {
			form.once('close', function () {
				done(true);
			});
		},

		// (2)
		// As soon as at least one file is received on any Upstream.
		function receivedFirstFileOfRequest ( done ) {
			self.once('firstFile', function () {
				done(true);
			});
		},

		// (3)
		// If no files have been received by the time
		// `maxWaitTimeBeforePassingControlToApp`ms have elapsed,
		// go ahead and proceed.
		function impatient ( done ) {
			var maxWaitTimeBeforePassingControlToApp = 50;
			timer = setTimeout(function () {
				done(true);
			}, maxWaitTimeBeforePassingControlToApp);
		}

	],
	function iterator (guard, done) {
		guard(done);
	},
	function passControlToApp () {
		// Careful: No error argument allowed in this callback!

		// Make sure the `impatient` timeout fires no more than once
		clearTimeout(timer);

		// Pass control to app.
		console.log('Passing control to app...');
		self._hasPassedControlToApp = true;
		self.next();
	});



	// Lastly, start parsing the incoming multipart upload request.
	form.parse(this.req);
};
