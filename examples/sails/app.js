require('colors');

require('sails').lift({
	hooks: {
		grunt: false
	},
	express: {
		bodyParser: require('../../'),
		silenceMultipartWarning: true
	}
}, function sailsIsReady (err, sails) {
	if (err) throw err;

	sails.log.blank();
	sails.log.info(
		'Send a multipart form upload with a file in the `avatar` field to '+
		'http://localhost:1337/file/upload'.underline
	);
});