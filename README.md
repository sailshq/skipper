# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

Skipper makes it easy to implement streaming file uploads to disk, S3, or any of its supported file adapters.

============================================

## Quick Start

The following example assumes skipper is already installed as the body parser in your Express or Sails app. It receives one or more files from a **file parameter** named `avatar` using the default, built-in file adapter (skipper-disk).  This streams the file(s) to the default upload directory `.tmp/uploads/` on the server's local disk.

```javascript
req.file('avatar').upload(function (err, uploadedFiles){
  if (err) return res.send(500, err);
  return res.send(200, uploadedFiles);
});
```
============================================


## Installation

Skipper is installed in [Sails](http://beta.sailsjs.org) automatically (see https://github.com/sails101/file-uploads for a sample Sails app that handles file uploads).

To install Skipper in a vanilla [Express](http://expressjs.org) app:

```sh
npm install skipper --save
```

```js
app.use(require('skipper')());
```

============================================


## Using `req.file(...).upload()`

As is true with most methods on `req`, usage of Skipper's `req.file()` is identical between Sails (in a controller) and Express (in a route).

```javascript
req.file('avatar').upload(function (err, uploadedFiles) {
  if (err) return res.send(500, err);
  return res.json({
    message: uploadedFiles.length + ' file(s) uploaded successfully!',
    files: uploadedFiles
  });
});
```

#### Options

 Option      | Type                             | Description
 ----------- | -------------------------------- | --------------
 dirname     | ((string))                       | Optional. The path to the directory on the remote filesystem where file uploads should be streamed.  May be specified as an absolute path (e.g. `/Users/mikermcneil/foo`) or a relative path.  In the latter case, or if no `dirname` is provided, the configured filesystem adapter will determine a `dirname` using a conventional default (varies adapter to adapter).  If `dirname` is used with `saveAs`- the filename from saveAs will be relative to dirname.
 saveAs      | ((string)) -or- ((function))     | Optional.  By default, Skipper decides an "at-rest" filename for your uploaded files (called the `fd`) by generating a UUID and combining it with the file's original file extension when it was uploaded ("e.g. 24d5f444-38b4-4dc3-b9c3-74cb7fbbc932.jpg"). <br/>  If `saveAs` is specified as a string, any uploaded file(s) will be saved to that particular path instead (useful for simple single-file uploads).<br/> If `saveAs` is specified as a function, that function will be called each time a file is received, passing it the raw stream and a callback (useful for multi-file uploads). For example: <br/> `function (__newFileStream,cb) { cb(null, 'theUploadedFile.foo'); }` <br/>If a file already exists with the same `fd`, it will be overridden.<br/>The final file descriptor (`fd`) for the upload will be resolved relative from `dirname`.
 maxBytes    | ((integer))                      | Optional. Max total number of bytes permitted for a given upload, calculated by summing the size of all files in the upstream; e.g. if you created an upstream that watches the "avatar" field (`req.file('avatar')`), and a given request sends 15 file fields with the name "avatar", `maxBytes` will check the total number of bytes in all of the 15 files.  If maxBytes is exceeded, the already-written files will be left untouched, but unfinshed file uploads will be garbage-collected, and not-yet-started uploads will be cancelled.  (Note that `maxBytes` is currently experimental)
 onProgress  | ((function))                     | Optional. This function will be called again and again as the upstream pumps chunks into the receiver with an object representing the current status of the upload, until the upload completes.  Currently experimental.


============================================


## Use Cases


#### Uploading files to disk

[skipper-disk](https://github.com/balderdashy/skipper-disk) is a file adapter that uploads files to the local hard drive on the server.  It is bundled with Skipper, so if an `adapter` option is not specified (as in the [Quick Start]() example above) it is used by default.

```js
req.file('avatar').upload({
  // ...any other options here...
}, ...);
```

It exposes the following adapter-specific options:

 Option     | Type                             | Description
 ---------- | -------------------------------- | --------------
 onProgress | ((function))                     | todo: document


#### Uploading files to S3

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

 Option     | Type                             | Description
 ---------- | -------------------------------- | --------------
 key        | ((string))                       | Your AWS "Access Key ID", e.g. `"BZIZIZFFHXR27BFUOZ7"` (_required_)
 secret     | ((string))                       | Your AWS "Secret Access Key", e.g. `"L8ZN3aP1B9qkUgggUnEZ6KzrQJbJxx4EMjNaWy3n"` (_required_)
 bucket     | ((string))                       | The bucket to upload your files into, e.g. `"my_cool_file_uploads"` (_required_)
 endpoint   | ((string))                       | By default all requests will be sent to the global endpoint `s3.amazonaws.com`. But if you want to manually set the endpoint, you can do it with the endpoint option. |
 region     | ((string))                       | The S3 region where the bucket is located, e.g. `"us-west-2"`. Note: If `endpoint` is defined, `region` will be ignored. Defaults to `"us-standard"` |
 tmpdir     | ((string))                       | The path to the directory where buffering multipart requests can rest their heads.  Amazon requires "parts" sent to their multipart upload API to be at least 5MB in size, so this directory is used to queue up chunks of data until a big enough payload has accumulated.  Defaults to `.tmp/s3-upload-part-queue` (resolved from the current working directory of the node process- e.g. your app)


#### Uploading files to gridfs

```shell
$ npm install skipper-gridfs --save
```

[skipper-gridfs](https://github.com/willhuang85/skipper-gridfs) is a filesystem adapter which enables Skipper to stream file uploads directly to MongoDB's GridFS.

```js
req.file('avatar').upload({
  // ...any other options here...
  adapter: require('skipper-gridfs'),
  uri: 'mongodb://[username:password@]host1[:port1][/[database[.bucket]]'
}, ...);
```

It exposes the following adapter-specific options:

 Option    | Type                             | Description
 --------- | -------------------------------- | --------------
 uri       | ((string))                       | the MongoDB database where uploaded files should be stored (using [mongo client URI syntax](http://api.mongodb.org/java/current/com/mongodb/MongoClientURI.html)) <br/> e.g. `mongodb://jimmy@j1mtr0n1xx@mongo.jimmy.com:27017/coolapp.avatar_uploads`


<!--
============================================

#### Customizing at-rest filenames for uploads

> TODO: document `saveAs`

#### Restricting file size

> TODO: document `maxBytes`


  #### Preventing/allowing uploads of a certain file type
> TODO

#### Compressing uploaded files
> TODO

#### Encrypting uploaded files
> TODO

#### Creating thumbnails for uploaded images
> TODO
-->

============================================


## Background

Skipper extends the [HTTP body parser used in Sails and Express](https://github.com/expressjs/body-parser).

It parses multipart requests (file uploads) using [andrewrk/node-multiparty](https://github.com/andrewrk/node-multiparty), but instead of buffering to a `tmp` directory on disk, it exposes uploaded files as streams.  This allows Skipper to run your application code _before the file uploads are saved_ affording a number of benefits.  Additionally, Skipper implements a file adapter specification that can be used to connect "upstreams" with various APIs (Box.net, imgur, whatever) with minimal integration effort.


#### File Adapters

The upstreams you get from `req.file()` can be hooked up to any compatible skipper adapter (e.g. local filesystem, S3, grid-fs).  File upload adapters maintain a consistent specification for certain options/features; things like specifying the at-rest filename for a file upload or indicating the maximum upload size for a particular request.  However some file adapters may provide additional functionality/options which are not part of the specification-- that's ok too!  When possible, new features/options introduced by individual adapters will be standardized and pulled into the core spec, where they can be uniformly tested (in an adapter-agnostic way) using the skipper-adapter-tests module (inspired by the approach taken in [waterline-adapter-tests](https://github.com/balderdashy/waterline-adapter-tests))

#### Stream Processing

Working with upstreams means you can process file uploads in flight-- _before_ they land on your server.  This makes features like terrabyte file uploads (or ∞-byte, for that matter) a possibility by allowing you to restrict/limit uploads without receiving the entire thing.  You can even tap into the raw file streams to peform streaming encryption, compression, or even image thumbnailing (although currently this requires implementing your own stream processing logic.  Simple, one-line configuration to opt into those features is on the roadmap.)

#### Lazy Stream Initialization

Skipper only examines/processes any given file upload for as long as it takes to determine whether it is _actually used_ by your app.  For instance, if you don't code `req.file('fake')` in your app code, the stream will be ignored, whether it contains a 25KB image or a 30TB binary payload. This conserves valuable system resources and reducing the effectiveness of would-be DDoS attacks.

#### Text Parameters

Not only do you get access to incoming file uploads as raw streams, Skipper allows you to access the other _non-file_ metadata parameters (e.g "photoCaption" or "commentId") in the conventional way.  That includes url/JSON-encoded HTTP body parameters (`req.body`), querystring parameters (`req.query`), or "route" parameters (`req.params`); in other words, all the standard stuff sent in standard AJAX uploads or HTML form submissions.  And helper methods like `req.param()` and `req.allParams()` work too.

> It is important to realize that the benefit above **relies on a crucial, simplifying assumption**: that user agents send any **text parameters** _before_ the first **file parameter** in the multipart HTTP request body.  For instance, in an HTML form that means putting all of your `<input type="file"/>` tags **after** the other inputs.  If you don't want to lay your form out that way, you'll want to use AJAX to submit it instead (see [jQuery File Upload](https://github.com/blueimp/jQuery-File-Upload) / [Angular File Upload](https://github.com/danialfarid/angular-file-upload)) or listen for the form's "submit" event to reorder the inputs before submitting the form to the server.


#### The Big Assumption: Field Order

After a lot of research, @zolmeister, @sgress454 and I came to understand a critical fact about multipart form data: that fields are sent _in order_ by browsers.  This is true even as far back as IE6!

+ http://stackoverflow.com/a/7450170/486547
+ http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4
+ https://github.com/jnicklas/capybara/issues/670#issue-3711585

#### Scenarios

I realize there's a lot going on in here, so for sanity/confidence, let's look at some edge cases and explain how Skipper addresses them:

#### EMAXBUFFER
> TODO: document

#### ETIMEOUT
> TODO: document

....others...


#### History

This module ~~may~~ **will** be included as a part of the stable release of Sails v0.10.  However we need help with documentation, examples, and writing additional receivers (currently receivers for S3 and local disk exist.)

> The decision to include skipper in Sails v0.10 was tough-- it has stalled our release.  However, it was a consequence of rewriting this module to use streams2, as well as the spotty/fragmented/confusing state of file uploads around the community.  We hope this module helps clear things up for everybody.



## FAQ


#### How Does the Multipart Body Parser Work?

_When a multipart request is received..._

1. Skipper waits _just long enough_ to identify the first file being uploaded in a request, then gathers up all the text parameters it's seen _so far_ and **runs** your application code (i.e. calls `next()`).

2. In your application code, you call `req.file('foo')` to listen for file uploads sent as the "foo" parameter.  This returns an "upstream"-- a stream of binary file streams; one for each file that was uploaded to the specified parameter ("foo") via an HTTP multipart file upload.  At that point, if Skipper has already seen files come in as "foo", it will start uploading to the file adapter.  This involves replaying the first buffered bytes its received of "foo" file uploads so far and "pumping" those streams so they start sending more bytes; i.e. relieving TCP backpressure.  If Skipper has NOT already received any files as "foo", it will start listening for them.

3. When the request ends, or a significant (configurable) period of time has passed since a new file upload has shown up on "foo", the upstream is considered to be complete.  If you're using `req.file('foo').upload(function(err,uploadedFiles){ ... })`, the callback will be triggered with `uploadedFiles` as an array of metadata objects describing the files that were uploaded (including the at-rest file descriptor.)   If an error occured, the callback will be triggered with `err` instead.  (Note that, if you're using the raw upstream directly, you can listen for the "finish" and "error" events to achieve the same effect.)

4. In general, when possible, you should put `req.file()` outside of asynchronous callbacks in your code.  However this isn't always possible-- Skipper tolerates this case "holding on" to unrecognized file streams (e.g. "bar") for a configurable period of time. If you don't use `req.file("bar")` right away in your code, Skipper will "hold on" to any files received on that parameter ("bar").  However it __won't pump bytes from those files__ until you use `req.file('bar')` in your code.  It does this without buffering to disk/memory by properly implementing Node's streams2 interface, which applies TCP backpressure and _actually slows down_, or even pauses, the upload.  If you __never__ use `req.file('bar')` in your code, any unused pending file streams received on "bar" will be discarded when the request ends.



#### What are Upstreams?

An upstream is an [object-mode Readable stream]() of [Readable streams]().  It's purpose is to pump out incoming files.

When you call `req.file('foo')`, the upstream for the "foo" parameter in the current request (`req`) is lazy-initialized and returned (subsequent calls to `req.file('foo')` will return the same upstream, calling `req.file('bar')` will return the upstream for "bar", etc.).


```
•---------------------•
|   req.file('foo')   |   <------- an upstream
•----====-------------•
     |  |
     |  |
     |f2|     <------- an incoming file upload stream
     |  |
     |  |
     |f1|     <------- an incoming file upload stream
     |  |
     |  |
     |f0|     <------- an incoming file upload stream
    _|  |_
    \    /
     \  /
      \/
```



#### What are Upstream Receivers?


An **upstream receiver** is an [object-mode Writable stream](http://nodejs.org/api/stream.html#stream_object_mode) of [Writable streams](http://nodejs.org/api/stream.html#stream_class_stream_writable).

It's purpose is to receive incoming files that get pumped out of an upstream.  Whenever a new file shows up, the receiver's `_write()` method gets called, and the receiver writes it to the remote filesystem.


```
•-----------------•
|  some upstream  |
•----====---------•
     |  |
     |  |
     |f2|   <------- an incoming file upload stream
     |  |
     |  |
     |f1|   <------- an incoming file upload stream
     |  |
     |  |
     |f0|   <------- an incoming file upload stream
    _|  |_
    \    /
o----ª==ª----o
|  receiver  |
o------------o
```


#### What are Filesystem Adapters?

A **filesystem adapter** is a node module which exports an object with the following functions:

 Method      | Description
 ----------- | ------------------
 `ls()`      | Get the contents of the specified directory on the remote filesystem (returns an array of string file/folder names)
 `read()`    | Get a file from the remote filesystem
 `rm()`      | Remove a file or directory from the remote filesystem
 `receive()` | Return an "upstream receiver" which will receive files pumped from an upstream and write them to the remote filesystem

At present, the first three methods are actually only used by skipper-adapter-tests to test your module.  That said, it is unlikely that any of one them involves writing more than ~5-20 lines of code, so it's worth it to create them so you can use the generic test suite.  See [skipper-disk](https://github.com/balderdashy/skipper-disk/blob/master/index.js#L27) or [skipper-s3](https://github.com/balderdashy/skipper-s3/blob/master/index.js#L54) for example implementations.

The most important method is `receive()` -- it builds the upstream receiver which is responsible for writing incoming files to the remote filesystem.


<!--
 TODO: simplify the API for building receivers- we could make it so you really only need to define the _write() method
-->


============================================


## Low-Level Usage

> **Warning:**
> You probably shouldn't try doing anything in this section unless you've implemented streams before, and in particular _streams2_ (i.e. "suck", not "spew" streams).



#### File adapter instances, receivers, upstreams, and binary streams

First instantiate a blob adapter (`blobAdapter`):

```js
var blobAdapter = require('skipper-disk')();
```

Build a receiver (`receiving`):

```js
var receiving = blobAdapter.receive();
```

Then you can stream file(s) from a particular field (`req.file('foo')`):

```js
req.file('foo').upload(receiving, function (err, filesUploaded) {
  // ...
});
```

#### `upstream.pipe(receiving)`

As an alternative to the `upload()` method, you can pipe an incoming **upstream** returned from `req.file()` (a Readable stream of Readable binary streams) directly to the **receiver** (a Writable stream for Upstreams.)


```js
req.file('foo').pipe(receiving);
```

There is no performance benefit to using `.pipe()` instead of `.upload()`-- they both use streams2.  The `.pipe()` method is available merely as a matter of flexibility/chainability.  Be aware that `.upload()` handles the `error` and `finish` events for you; if you choose to use `.pipe()`, you will of course need to listen for these events manually:

```js
req.file('foo')
.on('error', function onError() { ... })
.on('finish', function onSuccess() { ... })
.pipe(receiving)
```

Also bear in mind that you must first intercept the upstream and attach an `fd` (file descriptor) property to each incoming file stream.

Generally, you're better off sticking with the standard usage.


#### Implementing `receive()`

The `receive()` method in a filesystem adapter must build and return a new upstream receiver.

This is the hardest part-- if you implement this, everything else in your adapter is a piece of cake.  Here's a quick walk-through of how you can build and return a upstream receiver instance:

> TODO: make sure this fd stuff is working-- may need to roll back docs to match the version on npm and pull this on a branch so as not to confuse anybody while this is in flux

```js

function receive() {

  // Build an instance of a writable stream in object mode.
  var receiver__ = require('stream').Writable({ objectMode: true });

  // This `_write` method is invoked each time a new file is pumped in
  // from the upstream.  `__newFile` is a readable binary stream.
  receiver__._write = function onFile(__newFile, _unused, done) {

    // If you are piping to this receiver using Skipper, adapter options like "bucket"
    // will be available as `__newFile.options` (otherwise it will be an empty object).
    var options = __newFile.options;


    // To determine location where file should be written on remote filesystem,
    // calculate the output path as follows:
    var outputPath = require('path').join(__newFile.dirname, __newFile.fd);


    // Then ensure necessary parent directories exist
    // ...

    // Create/acquire a writable stream to the remote filesystem
    // (this may involve using options like "bucket", "secret", etc. to build an appropriate request)
    // ...
    var outs__ = getWriteStreamSomehow(outputPath, encoding);


    // Pump bytes from the incoming file (`__newFile`)
    // to the outgoing stream towards the remote filesystem (`outs__`)
    __newFile.pipe(outs__);


    // Bind `finish` event for when the file has been completely written.
    outs.once('finish', function () {
      done();
    });


    // Handle potential error from the outgoing stream
    outs__.on('error', function (err) {

      // If this is not a fatal error (e.g. certain types of "ECONNRESET"s w/ S3)
      // don't do anything.
      if ( ! findOutIfIsFatalSomehow(err) ) return;

      // The handling of this might vary adapter-to-adapter, but at some point, the
      // `done` callback should be triggered w/ a properly formatted error object.
      // Since calling `done(err)` will cause an `error` event to be emitted on the receiver,
      // it is important to format the error in this way (esp. with code===E_WRITE) so it can
      // be detected and discriminated from other types of errors that might be emitted from a
      // receiver.
      return done({
        incoming: __newFile,
        outgoing: outs__,
        code: 'E_WRITE',
        stack: typeof err === 'object' ? err.stack : new Error(err),
        name: typeof err === 'object' ? err.name : err,
        message: typeof err === 'object' ? err.message : err
      });
      // If this receiver is being used through Skipper, this event will be intercepted and, if possible
      // (if the adapter implements the `rm` method) any bytes that were already written for this file
      // will be garbage-collected.
    });

  };

  return receiver__;
}
```


========================================

#### Specifying Options

All options may be passed in using any of the following approaches, in ascending priority order (e.g. the 3rd appraoch overrides the 1st)


###### 1. In the blob adapter's factory method:

```js
var blobAdapter = require('skipper-disk')({
  // These options will be applied unless overridden.
});
```

###### 2. In a call to the `.receive()` factory method:

```js
var receiving = blobAdapter.receive({
  // Options will be applied only to this particular receiver.
});
```

###### 3. Directly into the `.upload()` method of the Upstream returned by `req.file()`:

```js
var upstream = req.file('foo').upload({
  // These options will be applied unless overridden.
});
```


============================================


## Status

This module is published on npm.  Development takes place on the `master` branch.

See [ROADMAP.md]() for more information on where the project is headed and how you can contribute.

============================================

## More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- [Waterline (ORM)](http://github.com/balderdashy/waterline)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>

============================================

## License

**[MIT](./LICENSE)**
&copy; 2014
[Mike McNeil](http://michaelmcneil.com), [Scott Gress](https://github.com/sgress454), [Balderdash](http://balderdash.co) & contributors

This module is part of the [Sails framework](http://sailsjs.org), and is free and open-source under the [MIT License](http://sails.mit-license.org/).


![bkgd_seaScene.png](http://i.imgur.com/JpaJ8qw.png)


[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/a22d3919de208c90c898986619efaa85 "githalytics.com")](http://githalytics.com/balderdashy/skipper)





<!--
  #### Using an upstream receiver

Whether you get it from calling `.receive()` on an adapter, or build a quick custom receiver, the usage is the same:

```js
req.file('foobar').upload(myReceiver, function onUploadComplete (err, uploadedFiles) {
  // ...
});
```

-or-

```js
req.file('foobar').pipe(myReceiver)
.once('error', function (err){
  // ...
})
.once('finish', function (uploadedFiles){
  // ...
});
```
-->

<!--
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
