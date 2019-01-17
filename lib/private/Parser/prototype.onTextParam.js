/**
 * Module dependencies
 */

var StringDecoder = require('string_decoder').StringDecoder;
var debug = require('debug')('skipper');
var _ = require('@sailshq/lodash');



/**
 * Receive a text parameter.
 *
 * > See comments below for more about how decoding works.
 *
 * @param  {stream.Readable} part			[a text parameter from one of the fields in the multipart upload]
 */

module.exports = function onTextParam(part) {

  var self = this;
  var field = part.name;
  var value = '';
  var decoder = new StringDecoder(this.form.encoding);

  // Track fields that receive multiple param values
  //
  // > FUTURE: remove this, it's no longer necessary and is a bit confusing
  // > (see notes below about the new, header-based approach for encoding nested
  // > dictionaries and arrays in text params of multipart/form-data requests)
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
    }//•

    // Otherwise, IWMIH, buffer is null, meaning we've now received all of the
    // bytes from the textparam.
    debug('Parser: Done reading textparam through field `' + field + '`');

    // Disregard this field if it is a problematic field name (e.g. "constructor" or "__proto__").
    // > Inspired by https://github.com/ljharb/qs/commit/dbf049d9fafb5c0716a3bcae80af6f4b8337b9f4
    // > And https://github.com/sailshq/lodash/commit/3f3d78dc3f756f4148a3832798e868ca7192c817#diff-6d186b954a58d5bb740f73d84fe39073R640
    if (Object.prototype.hasOwnProperty(field)) {
      textParamMetadata.done = true;// « see below for explanation of what this is doing
      return;
    }//•

    // Since this is a multipart HTTP request, there's no widely-adopted and
    // widely-trusted convention for sending big, complex data structures as
    // text parameters from the client, then losslessly rehydrating them on
    // the server.
    //
    // So to work around this, we'll check for a special "X-JSON-MPU-Params" header
    // in the request (could be sent by anything, but if present, it was likely
    // sent from Parasails/Cloud SDK).  If this header is set, and clearly
    // formatted for our use case here, then we'll attempt to JSON.parse() the
    // body text params that it indicates.
    // > Note that we are tolerant towards problems, since it is hypothetically
    // > possible it could be sent for some unrelated reason.
    //
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // > Note that text parameters can (probably) not be encoded in a format like
    // > JSON as part of the multipart upload HTTP spec  (at least not cleanly).
    // > For more information/discussion on this, see:
    // > • https://github.com/postmanlabs/postman-app-support/issues/3331
    // > • https://github.com/postmanlabs/postman-app-support/issues/1104
    // >
    // > Also note that Sails/parasails/Cloud SDK automatically appends a special
    // > header to the request called "X-JSON-MPU-Params" which identifies the names
    // > of text parameters that are sent as stringified JSON and thus should be
    // > parsed as such on the server.  (Only relevant for "multipart/form-data".)
    // >
    // > Last but not least, some historical context:
    // >  • https://github.com/sailshq/machine-as-action/commit/16062c568d0587ea0b228613a686071666b6e690
    // >  • see GitHub comments on that commit for related changes in other packages
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    if (_.isFunction(self.req.get)) {
      var rawXJSONMPUParamsHeader = self.req.get('X-JSON-MPU-Params');
      if (rawXJSONMPUParamsHeader && _.isString(rawXJSONMPUParamsHeader) && _.find(rawXJSONMPUParamsHeader.split(','), function(paramName) { return paramName === field; })) {
        try {
          value = JSON.parse(value);
        } catch (unusedErr) { /* Silently ignore any JSON parsing errors (as explained above) */ }
      }//ﬁ
    }//ﬁ

    // If `req.body` already contains `field`, and this is the first duplicate value
    // (i.e. the second value to come in for this param) track it as a "multifield"
    // and build an array of param values.
    // (We have to do this in case the original value was an array itself- we wouldn't
    // want to push subsequent values onto THAT array, y'know?)
    //
    // > FUTURE: remove this "multifield" behavior (see above for explanation)
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
