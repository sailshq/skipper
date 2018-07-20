/**
 * Module dependencies
 */

var StringDecoder = require('string_decoder').StringDecoder;
var debug = require('debug')('skipper');



/**
 * Receive a text parameter.
 *
 * @param  {stream.Readable} part			[a text parameter from one of the fields in the multipart upload]
 */

module.exports = function onTextParam(part) {

  var self = this;
  var field = part.name;
  var value = '';
  var decoder = new StringDecoder(this.form.encoding);

  // Track fields that receive multiple param values
  self.multifields = self.multifields || {};

  // After control has been relinquished, any textparams received should be ignored
  // since its too late to include them in `req.body` (subsequent app code is already running)
  // So emit a warning.
  if (this._hasPassedControlToApp) {
    this.emit('warning',
      'Unable to expose body parameter `'+field+'` in streaming upload!\n'+
      'Client tried to send a text parameter ('+field+') ' +
      'after one or more files had already been sent.\n'+
      'Make sure you always send text params first, then your files.\n'+
      '(In an HTML form, it\'s as easy as making sure your text inputs are listed before your file inputs.'
    );
    // Redirect the part stream into the data toilet.
    // This ensures that the stream will close properly.
    part.on('readable', function onBytesAvailable() {
      // Read until the buffer is dry.
      while (null !== part.read()) { /* no-op */ }
    });
    return;
  }

  // Track the newly detected param
  var textParamMetadata = {
    done: false,
    stream: part
  };
  this.textParams.push(textParamMetadata);


  // Now receive bytes from the text param:

  // FUTURE: Try to use pipe instead, or better yet, defer to the built-in handling
  // w/i formidable/multiparty (as long as we're absolutely certain that doesn't
  // trigger writing .tmp files to disk.)
  part.on('readable', function onBytesAvailable() {

    var buffer = '';
    var chunk;
    while (null !== (chunk = part.read())) {
      buffer += chunk;
    }

    // New bytes available for text param:
    if (buffer) {

      // FUTURE: make `maxFieldsSize` directly configurable via `options`
      self.form._fieldsSize += buffer.length;
      if (self.form._fieldsSize > self.form.maxFieldsSize) {
        self.form._error(new Error('maxFieldsSize exceeded, received ' + self.form._fieldsSize + ' bytes of field data'));
        return;
      }
      value += decoder.write(buffer);
      debug('Parser: Read a chunk of textparam through field `' + field + '`');
      return;
    }

    debug('Parser: Done reading textparam through field `' + field + '`');

    //
    // Otherwise, if buffer is null, that means we've now received all of the bytes
    // from the textparam.
    //

    // If `req.body` already contains `field`, and this is the first duplicate value
    // (i.e. the second value to come in for this param) track it as a "multifield"
    // and build an array of param values.
    // (We have to do this in case the original value was an array itself- we wouldn't
    // want to push subsequent values onto THAT array, y'know?)
    if (self.req.body[field]) {

      if (self.multifields[field]) {
        self.req.body[field].push(value);
      } else {
        debug('`' + field + '` param already exists in req.body, converting into a "multifield"...');
        self.req.body[field] = [self.req.body[field]];
        self.multifields[field] = true;
        self.req.body[field].push(value);
      }
    } else {
      self.req.body[field] = value;
    }

    // Mark that this textParam is done streaming in data in its
    // `textParamMetadata` object.  This is monitored and used so
    // we know to wait for any known textParams to finish streaming
    // before we pass control to the app.
    textParamMetadata.done = true;

  });


};
