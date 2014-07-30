# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

Skipper makes it easy to implement streaming file uploads to disk, S3, or any of its supported file adapters.

============================================

### Quick Start

The following example assumes skipper is already installed as the body parser in your Express or Sails app. It receives one or more files from a **file parameter** named `avatar` using the default, built-in file adapter (skipper-disk).  This streams the file(s) to the default upload directory `.tmp/uploads/` on the server's local disk.

```javascript
req.file('avatar').upload(function (err, uploadedFiles){
  if (err) return res.send(500, err);
  return res.send(200, uploadedFiles);
});
```
============================================


### Installation

Skipper is installed in [Sails](http://beta.sailsjs.org) automatically (see https://github.com/sails101/file-uploads for a sample Sails app that handles file uploads).

To install Skipper in a vanilla [Express](http://expressjs.org) app:

```sh
npm install skipper --save
```

```js
app.use(require('skipper')());
```

============================================


### req.file()

As is true with most methods on `req` once installed, usage is identical between Sails (in a controller) and Express (in a route).

```javascript
req.file('avatar').upload(function (err, uploadedFiles) {
  if (err) return res.send(500, err);
  return res.json({
    message: uploadedFiles.length + ' file(s) uploaded successfully!',
    files: uploadedFiles
  });
});
```

##### Options

 Option    | Type                             | Description
 --------- | -------------------------------- | --------------
 dirname   | ((string))                       | todo
 saveAs    | ((string)) -or- ((function))     | todo
 maxBytes  | ((integer))                      | todo


> TODO: merge content from individual adapter readmes

============================================


### Use Cases


##### Uploading files to disk

[skipper-disk](https://github.com/balderdashy/skipper-disk) is a file adapter that uploads files to the local hard drive on the server.  It is bundled with Skipper, so if an `adapter` option is not specified (as in the [Quick Start]() example above) it is used by default.

```js
req.file('avatar').upload({
  // ...any other options here...
}, ...);
```

##### Uploading files to S3

```shell
$ npm install skipper-s3 --save
```

[skipper-s3](https://github.com/balderdashy/skipper-s3) is a filesystem adapter which enables Skipper to stream file uploads directly to Amazon S3.

```js
req.file('avatar').upload({
  // ...any other options here...
  adapter: require('skipper-s3'),
  key: 'YOUR_S3_API_KEY',
  secret: 'YOUR_S3_API_SECRET',
  bucket: 'YOUR_S3_BUCKET'
}, ...);
```

It exposes the following adapter-specific options:

 Option    | Type                             | Description
 --------- | -------------------------------- | --------------
 key       | ((string))                       | todo
 secret    | ((string))                       | todo
 bucket    | ((string))                       | todo


##### Uploading files to gridfs

```shell
$ npm install skipper-gridfs --save
```

[skipper-gridfs](https://github.com/willhuang85/skipper-gridfs) is a filesystem adapter which enables Skipper to stream file uploads directly to MongoDB's GridFS.

```js
req.file('avatar').upload({
  // ...any other options here...
  adapter: require('skipper-gridfs'),
  uri: 'YOUR_MONGO_URI(includes host, port, user, password, and database name'
}, ...);
```

It exposes the following adapter-specific options:

 Option    | Type                             | Description
 --------- | -------------------------------- | --------------
 uri       | ((string))                       | todo


##### Customizing at-rest filenames for uploads

> TODO

##### Restricting file size

> TODO


<!--
##### Preventing/allowing uploads of a certain file type
> TODO

##### Compressing uploaded files
> TODO

##### Encrypting uploaded files
> TODO

##### Creating thumbnails for uploaded images
> TODO
-->

============================================


### Background

Skipper extends the [HTTP body parser in Express/Sails](https://github.com/expressjs/body-parser).

It parses multipart requests (file uploads) using [andrewrk/node-multiparty](https://github.com/andrewrk/node-multiparty), but instead of buffering to a `tmp` directory on disk, it exposes uploaded files as streams.  This allows Skipper to run your application code _before the file uploads are saved_ affording a number of benefits.  Additionally, Skipper implements a file adapter specification that can be used to connect "upstreams" with various APIs (Box.net, imgur, whatever) with minimal integration effort.


##### File Adapters

The upstreams you get from `req.file()` can be hooked up to any compatible skipper adapter (e.g. local filesystem, S3, grid-fs).  File upload adapters maintain a consistent specification for certain options/features; things like specifying the at-rest filename for a file upload or indicating the maximum upload size for a particular request.  However some file adapters may provide additional functionality/options which are not part of the specification-- that's ok too!  When possible, new features/options introduced by individual adapters will be standardized and pulled into the core spec, where they can be uniformly tested (in an adapter-agnostic way) using the skipper-adapter-tests module (inspired by the approach taken in [waterline-adapter-tests](https://github.com/balderdashy/waterline-adapter-tests))

##### Stream Processing

Working with upstreams means you can process file uploads in flight-- _before_ they land on your server.  This makes features like terrabyte file uploads (or ∞-byte, for that matter) a possibility by allowing you to restrict/limit uploads without receiving the entire thing.  You can even tap into the raw file streams to peform streaming encryption, compression, or even image thumbnailing (although currently this requires implementing your own stream processing logic.  Simple, one-line configuration to opt into those features is on the roadmap.)

##### Lazy Stream Initialization

Skipper only examines/processes any given file upload for as long as it takes to determine whether it is _actually used_ by your app.  For instance, if you don't code `req.file('fake')` in your app code, the stream will be ignored, whether it contains a 25KB image or a 30TB binary payload. This conserves valuable system resources and reducing the effectiveness of would-be DDoS attacks.

##### Text Parameters

Not only do you get access to incoming file uploads as raw streams, Skipper allows you to access the other _non-file_ metadata parameters (e.g "photoCaption" or "commentId") in the conventional way.  That includes url/JSON-encoded HTTP body parameters (`req.body`), querystring parameters (`req.query`), or "route" parameters (`req.params`); in other words, all the standard stuff sent in standard AJAX uploads or HTML form submissions.  And helper methods like `req.param()` and `req.allParams()` work too.

> It is important to realize that the benefit above **relies on a crucial, simplifying assumption**: that user agents send any **text parameters** _before_ the first **file parameter** in the multipart HTTP request body.  For instance, in an HTML form that means putting all of your `<input type="file"/>` tags **after** the other inputs.  If you don't want to lay your form out that way, you'll want to use AJAX to submit it instead (see [jQuery File Upload](https://github.com/blueimp/jQuery-File-Upload) / [Angular File Upload](https://github.com/danialfarid/angular-file-upload)) or listen for the form's "submit" event to reorder the inputs before submitting the form to the server.


##### How It Works

1. Skipper waits _just long enough_ to identify the first file being uploaded in a request, then gathers up all the text parameters it's seen _so far_ and **runs** your application code (i.e. calls `next()`).

2. In your application code, you call `req.file('foo')` to listen for file uploads sent as the "foo" parameter.  This returns an "upstream"-- a stream of binary file streams; one for each file that was uploaded to the specified parameter ("foo") via an HTTP multipart file upload.  At that point, if Skipper has already seen files come in as "foo", it will start uploading to the file adapter.  This involves replaying the first buffered bytes its received of "foo" file uploads so far and "pumping" those streams so they start sending more bytes; i.e. relieving TCP backpressure.  If Skipper has NOT already received any files as "foo", it will start listening for them.

3. When the request ends, or a significant (configurable) period of time has passed since a new file upload has shown up on "foo", the upstream is considered to be complete.  If you're using `req.file('foo').upload(function(err,uploadedFiles){ ... })`, the callback will be triggered with `uploadedFiles` as an array of metadata objects describing the files that were uploaded (including the at-rest file descriptor.)   If an error occured, the callback will be triggered with `err` instead.  (Note that, if you're using the raw upstream directly, you can listen for the "finish" and "error" events to achieve the same effect.)

4. In general, when possible, you should put `req.file()` outside of asynchronous callbacks in your code.  However this isn't always possible-- Skipper tolerates this case "holding on" to unrecognized file streams (e.g. "bar") for a configurable period of time. If you don't use `req.file("bar")` right away in your code, Skipper will "hold on" to any files received on that parameter ("bar").  However it __won't pump bytes from those files__ until you use `req.file('bar')` in your code.  It does this without buffering to disk/memory by properly implementing Node's streams2 interface, which applies TCP backpressure and _actually slows down_, or even pauses, the upload.  If you __never__ use `req.file('bar')` in your code, any unused pending file streams received on "bar" will be discarded when the request ends.


##### Scenarios

I realize there's a lot going on in here, so for sanity/confidence, let's look at some edge cases and explain how Skipper addresses them:

##### EMAXBUFFER
> TODO

##### ETIMEOUT
> TODO

....others...


##### History

This module ~~may~~ **will** be included as a part of the stable release of Sails v0.10.  However we need help with documentation, examples, and writing additional receivers (currently receivers for S3 and local disk exist.)

> The decision to include skipper in Sails v0.10 was tough-- it has stalled our release.  However, it was a consequence of rewriting this module to use streams2, as well as the spotty/fragmented/confusing state of file uploads around the community.  We hope this module helps clear things up for everybody.






<!--
#### Stream file(s) somewhere else

Alternatively, to upload the file with any receiver other than the default [`skipper-disk`](http://github.com/balderdashy/skipper-disk):

```js
// ...
var SkipperS3 = require('skipper-s3')({ key: '...', secret: '...', bucket: '...' });
var receiving = SkipperS3.receive();
return req.file('foobar').upload(receiving, function onUploadComplete (err, uploadedFiles) {
  // ...
});
```



#### With Sails (v0.10.0)

As of v0.10.0-rc6, skipper is installed as the default request body parser in Sails- you don't need to install it again.


#### With Sails (v0.9.x)

To use skipper with an existing v0.9.x Sails app, you'll need to install skipper, then modify `config/express.js`:

```javascript
module.exports.express = {
  bodyParser: require('skipper')
};
```

#### With Express/Connect

This module is a drop-in replacement for the default Connect bodyParser, so if you're already using that bodyParser (`app.use(express.bodyParser)`), you'll need to replace it and hook up skipper instead.

e.g. in the module where you set up your middleware:

```javascript
// ...
app.use(require('skipper')());
// ...
```



```js
// ...
return req.file('foobar').upload('./.tmp/test.jpg', function onUploadComplete (err, uploadedFiles) {
  // ...
});
```

To use dynamic filenames (i.e. whatever the name of the original file was), and still contain files within a particular directory (defaults to `.tmp/uploads/` relative to the current working directory):

```js
// ...
return req.file('foobar').upload(function onUploadComplete (err, uploadedFiles) {
  // ...
});
```

-->

============================================

### Status

This module is published on npm.  Development takes place on the `master` branch.

============================================

### More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- [Waterline (ORM)](http://github.com/balderdashy/waterline)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>

============================================

### License

**[MIT](./LICENSE)**
&copy; 2014
[Mike McNeil](http://michaelmcneil.com), [Scott Gress](https://github.com/sgress454), [Balderdash](http://balderdash.co) & contributors

This module is part of the [Sails framework](http://sailsjs.org), and is free and open-source under the [MIT License](http://sails.mit-license.org/).


![bkgd_seaScene.png](http://i.imgur.com/JpaJ8qw.png)


[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/a22d3919de208c90c898986619efaa85 "githalytics.com")](http://githalytics.com/balderdashy/skipper)
