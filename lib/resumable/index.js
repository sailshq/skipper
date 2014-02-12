/**
 * Module dependencies
 */

var pause		= require('./pause');



/**
 * Resumeable
 *
 * Implements the pause/resume interface by mixing in `pause()` (buffer data) 
 * and `resume()` (replay data) to any Node stream instance, regardless of its
 * support for native buffering or pause/remove.
 *
 * Uses TJ Holawaychuk's micro-lib internally: 
 * https://github.com/visionmedia/node-pause
 */

module.exports = function Resumable (stream) {

	// This should be replaced with proper node stream
	// buffering when formidable is compatible  (or we replace it...)

	// Key that will be used to hold the buffering data while stream is paused
	var bufferKey = 'buffer_resumable';

	// Add pause and resume methods
	stream._pause = function () {
		console.log('* Pausing '+(stream.filename ? 'file `'+stream.filename+'`': 'UploadStream `'+stream.fieldName+'`')+'...');
		stream[bufferKey] = pause(stream);
		stream._fileparser_isPaused = true;
	};
	stream._resume = function () {
		console.log('* Resuming '+(stream.filename ? 'file `'+stream.filename+'`': 'UploadStream `'+stream.fieldName+'`')+'...');
		stream[bufferKey].resume();
		stream._fileparser_isPaused = false;
	};

	// Unused, as far as I can tell.
	// stream._abort = function () {
	// 	console.log('*** ABORTING '+(stream.filename ? 'file `'+stream.filename+'`': 'UploadStream `'+stream.fieldName+'`')+'...');
	// 	stream[bufferKey].end();
	// };

	// Also unused, as far as I can tell
	stream.on('error', function () {
		throw new Error('ENCOUNTERED ERROR!');
		// Cancel buffer replay
		// stream._abort();
	});


	// When the stream emits `end`, let's log some stuff:
	stream.on('end', function (err) {

		require('colors');
		if (stream.filename) {
			console.log('*** ENDING file `'+stream.filename+'` ('+(stream._fileparser_size/1000000)+'MB of data had been uploaded)...');
			if (err) { console.error('*** WITH ERROR:'.red,(err.toString()).red); }
		}
		else {
			console.log('*** ENDING UploadStream `'+stream.fieldName+'`  ('+(stream._bytesWritten/1000000)+'MB of data had been uploaded)...');
			if (err) { console.error('*** WITH ERROR:'.red,(err.toString()).red); }
		}

	});

	// Pause stream immediately to buffer any incoming data
	stream._pause();
};
