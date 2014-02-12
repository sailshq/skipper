/**
 * Module dependencies
 */

var fsx = require('fs-extra')
	, _ = require('lodash')
	, tmp = require('temporary')
	, crypto = require('crypto')
	, path = require('path');


var fileFixtures = [];
var outputDir;


module.exports = {

	setup: function() {

		// Create a tmp directory for our uploads to live in.
		outputDir = new tmp.Dir();

		// Create some nonsense files to upload,
		for (var bytes=10; bytes<10000000; bytes*=10) {
			var f = new tmp.File();
			f.writeFileSync(crypto.pseudoRandomBytes(bytes));
			fileFixtures.push({
				file: f,
				size: bytes
			});
		}
	},

	teardown: function () {

		// Clean up fixtures.
		_.each(fileFixtures, function (f) {
			f.file.unlinkSync();
		});

		// Clean up directory w/ test output.
		fsx.removeSync(outputDir.path);
	}
};
