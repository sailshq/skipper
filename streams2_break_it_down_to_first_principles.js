var _ = require('lodash');
var stream = require('stream');
var util = require('util');


// A readable stream
// (i.e. "Source" or "Sender")
function Incoming( opts ) {
	opts = opts || {};
	_.defaults(opts, {
		objectMode: true
	});

	stream.Readable.call(this, opts);


	// You can use this to optimize when chunks are sent.
	this._read = function ( requestedNumBytes ) {
		// no-op
	};

	var nextChunkId = 1;

	// Simulate incoming data
	var self = this;
	var lapTimerToSimulatePump = setInterval(function whenReadyToSendAChunk () {
		self.push(nextChunkId);
		console.log('Incoming: pumped chunk #'+nextChunkId);
		nextChunkId++;
	}, 10);


	// Simulate the end of incoming data
	// After this, no more chunks should be sent.
	// (otherwise an error will occur on the Incoming stream!)
	var timerToSimulateEnd = setTimeout(function whenDoneSendingChunks() {
		console.log('Incoming: done pumping.');
		
		// Ensure that no more chunks will be pumped.
		clearInterval(lapTimerToSimulatePump);

		self.push(null);
	}, 1500);
}

util.inherits(Incoming, stream.Readable);


// A writable stream
// (i.e. "Destination" or "Receiver")
function Outgoing ( opts ) {
	opts = opts || {};
	_.defaults(opts, {
		objectMode: true
	});

	stream.Writable.call(this, opts);

	var numChunksReceived = 0;
	var numChunksSent = 0;

	this._write = function (chunk, encoding, next) {
		console.log('Outgoing: received a chunk :: ',chunk);
		numChunksReceived++;

		// Simulate a clogged-up outgoing stream
		setTimeout(function whenReadyToWriteChunk() {
			numChunksSent++;
			console.log('Outgoing: wrote chunk :: ',chunk);
			next();
		}, 150);
	};
}
util.inherits(Outgoing, stream.Writable);


// Simple example

var i = new Incoming();
var o = new Outgoing();
i.on('error', function (e) { console.error('Error on incoming stream...'); throw e; });
o.on('error', function (e) { console.error('Error on outgoing stream...'); throw e; });

i.pipe(o);