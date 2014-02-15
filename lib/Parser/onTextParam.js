/**
 * Module dependencies
 */

var StringDecoder = require('string_decoder').StringDecoder
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

	// console.log('___ form parser discovered new textparam on field ::', '`'+field+'`');

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
			return;
		}


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
			return;
		}

		self.req.body[field] = value;

		// console.log('___) form parser | finished concating textparam from field ::', '`'+field+'`','::',self.req.body[field]);

	});


};