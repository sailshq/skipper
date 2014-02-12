/**
 * Module dependencies
 */

var fsx = require('fs-extra')
	, _ = require('lodash')
	, tmp = require('temporary')
	, crypto = require('crypto')
	, path = require('path')
	, Express = require('express')
	, http = require('http');


var FileParser = require('../../');



module.exports = function () {
	
	// Create an array of file fixtures.
	var fileFixtures = [];
	
	// Create a tmp directory for our uploads to live in.
	var outputDir = new tmp.Dir();


	// Expose some things
	var public = {

		srcFiles: fileFixtures,

		outputDir: outputDir,

		setup: function(done) {

			// Write nonsense bytes to our file fixtures.
			for (var bytes=10; bytes < 10000000; bytes*=10) {
				var f = new tmp.File();
				f.writeFileSync(crypto.pseudoRandomBytes(bytes));
				f.size = bytes;
				fileFixtures.push(f);
			}

			// Bootstrap a little express app that uses file-parser
			// to upload files to our outputDir
			public.app = Express();

			// Use file-parser middleware
			public.app.use( FileParser() );
			
			// Lift Express server on 3000
			public.server =
				http.createServer(public.app)
					.listen(3000)
					.on('listening', done);
		},

		teardown: function () {

			// Clean up fixtures.
			_.each(fileFixtures, function (f) {
				f.unlinkSync();
			});

			// Clean up directory w/ test output.
			fsx.removeSync(outputDir.path);

			// Lower Express server
			public.server.close();
		}
	};

	return public;
};
