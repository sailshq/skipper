module.exports = function(options) {
	
	/**
	 * Module dependencies
	 */

	var formidable = require('formidable'),
		_ = require('lodash'),
		util = require('util'),
		Resumable = require('./Resumable'),
		UploadStream = require('./UploadStream'),
		NoopStream = require('./NoopStream');


	// Apply defaults
	options = options || {};
	_.defaults(options, {
		maxWaitTime: 50,
		// environment: 'production'
	});
	// Instantiate logger
	var log = require('./logger')(options);

	// Pass logger down to dependencies that need it
	UploadStream = UploadStream(options);


	// Instantiate relevant connect bodyParsers
	// (for parsing text params in req.body)
	var bodyParsers = {
		urlencoded: require('connect').urlencoded(),
		json: require('connect').json()
	};




	/**
	 * File Parser
	 *
	 * Opinionated variant of the Connect body parser
	 * with support for streaming monolithic file uploads 
	 * to a compatible Waterline adapter
	 *
	 */
	return function streamingBodyParser(req, res, next) {

		// Spinlock to keep track of whether the stream parser has control
		var hasControl = true;

		// DEBUG:
		// Measure how long passes between the first run of the middleware
		// and the detection of the first file
		if (options.environment !== 'production') {
			console.time('streamingBodyParser waitTime');
		}

		// If this isn't a multipart request,
		// go ahead and parse everything as text parameters
		// (using underlying Connect bodyParser)
		// and continue to next middleware
		if (!req.is('multipart/form-data')) {
			log('Not a multipart request...');
			return parseAsTextParams(passControl);
		}

		// Reset the auto-increment id for this request
		// This is used to uniquely identify part/file streams 
		// across different UploadStreams and adapters.
		var _nextFileId = 0;

		// Aggregate any errors that occur
		var errors = [];

		// Clear out req.body so it can hold the body params
		req.body = req.body || {};


		// Expose `req.files` to subsequent middleware
		// (buffered UploadStream that signals when any file is uploaded)
		req.files = new UploadStream();

		// Set of buffered UploadStreams that watch particular fields
		// and signal when a file is uploaded to their field
		req.files._watchedFields = {};

		// Expose `req.file('fieldName')` to subsequent middleware
		// Returns a buffered UploadStream that signals ONLY when a file
		// is uploaded to the `fieldName` field
		req.file = function(fieldName) {

			if ( ! validFieldName(fieldName) ) {
				throw new Error(
					'Invalid usage of `req.file(\'fieldName\')`!' + '\n' +
					'`' + fieldName + '` is not a valid field name.'
				);
			}

			log('`req.file("'+fieldName+'")` was accessed...');


			// log('Here\'s what I have for that field stream currently:', req.files._watchedFields[fieldName]);
			// If the request has already ended, return a noop stream
			var fileIsBeingUploaded = req.files._watchedFields[fieldName];
			if (reqClosed) {    // && !fileIsBeingUploaded) {
				log('Creating a NoopStream to represent `'+fieldName+'`');
				return new NoopStream();
			}

			// Instantiate stream if it doesn't exist already
			// Save reference to fieldName (for use in logging)
			if (!req.files._watchedFields[fieldName]) {
				log('Creating a new UploadStream to represent `'+fieldName+'`');
				req.files._watchedFields[fieldName] = new UploadStream(fieldName);
				req.files._watchedFields[fieldName].fieldName = fieldName;
			}

			return req.files._watchedFields[fieldName];
		};

		// TODO:	if socket exists with matching session id, 
		//			subscribe it to progress updates for the upload stream(s)


		// Whether or not the body params have been captured and parsed.
		// Notably, this is declared `true` as soon as first file has been 
		// detected, since you should always be sending your semantic fields
		// BEFORE your binary file upload fields when submitting a multipart upload.
		var anyFilesDetected = false;

		// Indicates whether the request has been closed
		var reqClosed = false;


		// Maximum amount of time (ms) to wait before declaring 
		// "no files here, nope!"
		log(':::::::::::::: SET TIMEOUT :::::::::::::::');
		var maxWaitTimer = setTimeout(function giveUpOnFiles() {

			// If this isn't a multipart request,
			// go ahead and parse everything as text parameters
			// (using underlying Connect bodyParser)
			// and continue to next middleware
			if ( !anyFilesDetected ) {
				log('*** Timed out after waiting for files for ' + options.maxWaitTime + 'ms...');
				return passControl();
			}

		}, options.maxWaitTime);

		// Build form obj using formidable
		var form = new formidable.IncomingForm();

		// Subscribe listener to receive each formidable
		// FieldStream as it becomes available
		form.onPart = receiveFieldStream;

		// Tell Formidable to start parsing the the upload stream
		// `requestComplete` (Formidable's callback) is triggered 
		// when all FieldStreams have ended
		form.parse(req, requestComplete);


		/**
		 * Defer to the underlying Connect bodyParser
		 * to parse requests which do not contain multipart file uploads
		 */
		function parseAsTextParams (cb) {

			// Stub `req.files` and `req.file()`
			// to allow for consistent usage in subequent middleware
			// no matter the type of request
			req.file = function () { return new NoopStream(); };
			req.files = new NoopStream();

			// Pass textual body through to the relevant body parsers
			bodyParsers.urlencoded(req, res, function (err) {
				if (err) return cb(err);
				bodyParsers.json(req,res, cb);
			});
			return;
		}



		/**
		 * Called the first time one of the following occurs:
		 * -> the first file has been detected
		 * -> the request closes
		 * -> the maximum allowed wait-time has passed
		 *
		 * At this point, we can reasonable expect that all non-binary 
		 * params, i.e. req.params.all(), should be populated in req.body.
		 *
		 * NOTE:
		 * This function may actually be called more than once.  It uses
		 * the `hasControl` closure variable to prevent it from actually
		 * triggering the callback multiple times.
		 */

		function passControl(err) {


			// Cancel max-wait timer 
			// (since we could have gotten here via other means)
			log.verbose(':::::::::::::: CLEARED TIMEOUT :::::::::::::::');
			clearTimeout(maxWaitTimer);

			// If formidable finishes parsing the request stream, whether it's because
			// the request was canceled, the files finished uploading, or the response was sent,
			// buffering stops, since the UploadStream stops sending data.

			// Spinlock/CV
			// (make sure we only actually passControl() once)
			if (!hasControl) return;
			hasControl = false;


			log('-------- No more non-file params allowed. --------');
			if (options.environment !== 'production') {
				console.timeEnd('streamingBodyParser waitTime');
			}
			log('   * NEXT :: Passing control to app...');

			// So we're good!
			// (pass on error, if one exists)
			return next(err);
		}



		/**
		 * Triggered when formidable is finished parsing/uploading
		 * (all FieldStreams have ended).  Main purpose here is to end
		 * the UploadStream, which communicates completion to other users downstream.
		 *
		 * The `fields` and `files` arguments which you might expect to find as the 2nd and 3rd
		 * arguments are actually useless, since we're manually overriding formidable's `onPart`
		 * handler.
		 *
		 * @param {Error} err
		 */

		function requestComplete (err) {

			if (err) {
				log.error('Finished parsing multipart request stream, but with error :: ', err);
			}
			else log('Finished parsing multipart request stream (' + req.url + ')');

			// log('The following files were parsed ::', );

			// Notify global upload stream (`end`)
			req.files.end(err);

			// Notify any existing field upload streams (`end`)
			_.each(req.files._watchedFields, function(stream) {
				stream.end(err);
			});

			// Flag request as closed
			// This will force field upload streams added in subsequent middleware
			// with req.file() (i.e. user code) to end promptly
			reqClosed = true;

			// If no files were detected, go ahead and parse everything 
			// as text parameters and continue to next middleware
			// if (!anyFilesDetected) {
			//	return parseAsTextParams(passControl);
			// }

			return passControl();
		}



		/**
		 * Triggered when a new FieldStream is first detected in the UploadStream
		 *
		 * @param {Stream} fieldStream
		 */

		function receiveFieldStream(fieldStream) {

			var fieldName = fieldStream.name,
				isFile = !! fieldStream.filename;


			// Handle file streams manually
			if (isFile) {
				receiveFile(fieldStream);
				return;
			}

			// If the parameter is not a file, then it is a text param
			receiveTextParameter(fieldStream);
		}



		/**
		 * Triggered when a FieldStream is first identified as a semantic parameter
		 * (i.e. not a file)
		 *
		 * @param {Stream} fieldStream
		 */

		function receiveTextParameter (fieldStream) {

			var fieldName = fieldStream.name,
				value = '',
				StringDecoder = require('string_decoder').StringDecoder,
				decoder = new StringDecoder(form.encoding);

			fieldStream.on('data', function(buffer) {
				form._fieldsSize += buffer.length;
				if (form._fieldsSize > form.maxFieldsSize) {
					form._error(new Error('maxFieldsSize exceeded, received ' + form._fieldsSize + ' bytes of field data'));
					return;
				}
				value += decoder.write(buffer);
			});

			fieldStream.on('end', function() {
				
				log('!!!!! Saving text parameter (' + fieldName + ')...');

				// If a file has already been sent, but we run across a semantic param,
				// it's too late to include it in req.body, since the app-level code has
				// likely already finished.  Log a warning.
				if (anyFilesDetected) {
					log.error(
						'Unable to expose body parameter `' + fieldName + '` in streaming upload!\n',
						'Client tried to send a text parameter (' + fieldName + ') ' +
						'after one or more files had already been sent.\n',
						'Make sure you always send text params first, then your files.\n',
						'(In an HTML form, it\'s as easy as making sure your inputs are listed in that order.'
					);
				}

				// Save param
				req.body[fieldName] = value;
			});
		}



		/**
		 * Triggered when a FieldStream is first definitively identified as a multi-part
		 * file upload ( i.e. has `filename` property )
		 *
		 * @param {Stream} fieldStream
		 */

		function receiveFile(fieldStream) {
			var fieldName = fieldStream.name,
				filename = fieldStream.filename,
				logPrefix = ' * ',
				logSuffix = ':: file :: ' + fieldName + ', filename :: ' + filename;

			log('Identified file in `' + fieldName + '`');

			// Generate unique id for fieldStream 
			// then increment the _nextFileId auto-increment key
			fieldStream._id = _nextFileId;
			_nextFileId++;

			// Implements Resumable interface on stream-- pausing it immediately
			// (i.e. start a buffer and send data there instead of emitting `data` events)
			Resumable(fieldStream);

			log('Paused file in `' + fieldName + '`');

			// Announce the new file on the global listener stream
			req.files.write(fieldStream);

			// Find or create a listener stream for this particular field
			var specificUploadStream = req.file(fieldName);

			// Then announce the new file on it either way, since UploadStreams are
			// paused by default
			//
			// i.e. even if `req.file('fieldName')` happens afterwards,
			//		any writes we do now will be replayed when the UploadStream
			//		is resumed by the adapter.
			//
			specificUploadStream.write(fieldStream);


			// If this is the first file field we've discovered, declare the semantic
			// parameters as, for all intents and purposes, loaded, then start running 
			// app-level code.  If any more semantic params show up, we'll ignore them
			// and flash a warning.
			if (!anyFilesDetected) {
				receiveFirstFile();
			}
		}



		/**
		 * Triggered when a file is received for the first time
		 */

		function receiveFirstFile() {

			// Flag that first file has been received
			anyFilesDetected = true;

			// Continue to next middleware
			log('First uploading file detected...');
			return passControl();
		}



		/**
		 * validFieldName
		 *
		 * @param {String|Number} fieldName
		 * @returns whether `fieldName` is valid
		 */

		function validFieldName (fieldName) {
			return !_.isUndefined(fieldName) && (
				_.isString(fieldName) ||
				_.isFinite(fieldName) ||
				fieldName === 0
			);
		}


	};
};