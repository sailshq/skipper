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

	// Key that will be used to hold the buffering data while strea is paused
	var bufferKey = 'buffer_resumable';

	// Add pause and resume methods
	stream._pause = function () {
		stream[bufferKey] = pause(stream);
	}
	stream._resume = function () {
		stream[bufferKey].resume();
	}
	stream._abort = function () {
		stream[bufferKey].end();
	}

	stream.on('error', function () {

		// Cancel buffer replay
		stream._abort();
	})

	// Pause stream immediately to buffer any incoming data
	stream._pause();
}