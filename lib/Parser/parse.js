/**
 * Module dependencies
 */

var _ = require('lodash')
	, async = require('async')
	, STRINGFILE = require('../../stringfile')
	, log = require('../logger')
	, Form = require('./form');


/**
 * Begin parsing an incoming HTTP request (`this.req`).
 */

module.exports = function parseRequest () {
	var self = this;


	// Save reference to `form` instance.
	var form = this.form = Form();


	/**
	 * Receive/handle a new `part` stream from a field in the multipart upload.
	 * @param  {stream.Readable} part
	 */
	form.on('part', _.bind(function ( part ) {
		
		// Take care of text parameters (i.e. non-files)
		if ( !part.filename ) {
			this.onTextParam(part);
			return;
		}

		// Custom handler for fields w/ files
		this.onFile(part);
	}, this));



	
	// Only one 'error' event can ever be emitted, and if an 'error' event
	// is emitted, then 'close' will NOT be emitted.
	form.on('error', function (err) {

		// Emits error on all live Upstreams in this request.
		_(self.upstreams).each(function (up) {
			up.fatalIncomingError(err);
		});
	});


	// Emitted after all parts have been parsed and emitted. Not emitted if an
	// `error` event is emitted.
	form.on('close', function () {
		log((STRINGFILE.get('parser.form.onClose')).grey);

		// Informs all Upstreams in this request
		// that no more files will be sent.
		_(self.upstreams).each(function (up) {
			up.noMoreFiles();
		});

		// Uncomment this (and comment out the `noMoreFiles` business above)
		// to simulate an error for testing purposes:
		// up.fatalIncomingError('whee');
	});





	// Set up 3 conditions under which this Parser will pass control
	// to app-level code (i.e. call next())
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

		// (4?)
		// Should we also wait until all the chunks for every textparam
		// detected before the first file have been received?
		// This is probably not necessary, but leaving a stub here just in case.
		// If even plausible, it would only be relevant for extremely small files
		// preceded by huge text parameters.
		// .......
		// .......
		// .......
		// .......
		// .......

	],
	function iterator (guard, done) {
		guard(done);
	},
	function passControlToApp () {
		// Careful: No error argument allowed in this callback!

		// Make sure the `impatient` timeout fires no more than once
		clearTimeout(timer);

		// Pass control to app.
		log('Passing control to app...'.green);
		self._hasPassedControlToApp = true;
		self.next();
	});



	// Lastly, start parsing the incoming multipart upload request.
	form.parse(this.req);
};
