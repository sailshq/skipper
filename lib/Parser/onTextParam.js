/**
 * Module dependencies
 */

var StringDecoder = require('string_decoder').StringDecoder
	, log = require('../logger')
	, STRINGFILE = require('../../stringfile.js');




/**
 * Receive a text parameter.
 * 
 * @param  {stream.Readable} part			[a text parameter from one of the fields in the multipart upload]
 */

module.exports = function onTextParam ( part ) {

	var self = this;
	var field = part.name;
	var value = '';
	var decoder = new StringDecoder(this.form.encoding);


	// After control has been relinquished, any textparams received should be ignored
	// since its too late to include them in `req.body` (subsequent app code is already running)
	// So emit a warning.
	if (this._hasPassedControlToApp) {
		this.emit('warning', STRINGFILE.get('warning.paramArrivedTooLate', [field, field]));
		return;
	}

	// Track the newly detected param
	var textParamMetadata = {
		done: false,
		stream: part
	};
	this.textParams.push(textParamMetadata);


	// Now receive bytes from the text param:

	// TODO: 
	// Try to use pipe instead, or better yet, defer to the built-in handling
	// w/i formidable/multiparty (as long as we're absolutely certain that doesn't
	// trigger writing .tmp files to disk.)
	part.on('readable', function onBytesAvailable () {
		var buffer = part.read();

		// New bytes available for text param:
		if (buffer) {

			// TODO: make `maxFieldsSize` directly configurable via `options`
			self.form._fieldsSize += buffer.length;
			if (self.form._fieldsSize > self.form.maxFieldsSize) {
				self.form._error(new Error('maxFieldsSize exceeded, received ' + self.form._fieldsSize + ' bytes of field data'));
				return;
			}
			value += decoder.write(buffer);
			log(('Parser: Read a chunk of textparam through field `'+field+'`').grey);
			return;
		}

		log(('Parser: Done reading textparam through field `'+field+'`').grey);


		//
		// Otherwise, if buffer is null, that means we've now received all of the bytes
		// from the textparam.
		// 

		// TODO: emit events instead of mutating `req` directly here.
		// (so we don't have to pass `req` in.)
		
		// If `req.body` already contains `field` (which should never happen)
		// leave the old value alone.
		if (self.req.body[field]) {
			self.emit('warning', '`'+field+'` param already exists in req.body, ignoring new value.');

			// Consider this text parameter complete, since we won't wait for its bytes any longer.
			textParamMetadata.done = true;
			return;
		}

		self.req.body[field] = value;

		// Mark that this textParam is done streaming in data in its
		// `textParamMetadata` object.  This is monitored and used so
		// we know to wait for any known textParams to finish streaming
		// before we pass control to the app.
		textParamMetadata.done = true;

	});


};