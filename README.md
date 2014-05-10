# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

### Streaming Multipart File Upload Parsing 

Skipper is an opinionated variant of Connect's body parser designed to support the streaming upload of monolithic files to a compatible blob receiver, while still allowing application code to run in a timely manner.  It allows you to access textual metadata in the request body of multipart HTTP requests (ie. JSON/XML/urlencoded request body parameters) but still get streaming access to incoming files without writing .tmp files to disk.

> This module ~~may~~ **will** be included as a part of the stable release of Sails v0.10.  However we need help with documentation, examples, and writing additional receivers (currently receivers for S3 and local disk exist.)
> The decision to include skipper in v0.10 was tough-- it has stalled our release.  However, it was a consequence of rewriting this module to use streams2, as well as the spotty/fragmented/confusing state of file uploads around the community.  We hope this module helps clear things up for everybody.



### Installation

```sh
npm install skipper --save
```

> Skipper is installed in Sails automatically.  To install it into another Connect-based app (i.e. Express):
>
> ```js
> app.use(require('skipper')());
> ```


### Quick Start

> ##### Important
>
> Skipper is able to transparently stream your app's file uploads to any of its compatible receivers thanks to a crucial, > simplifying assumption: that all **text parameters** will be sent _before_ any **file parameters**.


#### Stream file(s) to disk

The following example receives a file from a **file parameter** named `avatar`, then streams it `.tmp/test.jpg` on the server's local disk:

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


### Usage

`req.file(foo)` returns a stream of binary streams- one for each file that was uploaded to the specified parameter (`foo`) via an HTTP multipart file upload.  As is true with most middleware, the usage is identical between Sails and Express.

#### With Sails

In one of your controller actions:

```javascript
  // ...
  upload: function  (req, res) {
    req.file('avatar').upload(function (err, files) {
      if (err) return res.serverError(err);
      return res.json({
        message: files.length + ' file(s) uploaded successfully!',
        files: files
      });
    });
  }
  // ...
```

#### With Express

```javascript
app.post('/upload', function uploadAction (req, res) {
  req.file('avatar').upload( function (err, files) {
    if (err) return res.send(500, err);
    return res.json({
      message: files.length + ' file(s) uploaded successfully!',
      files: files
    });
  });
});
```

### Status

This module is published on npm.  Development takes place on the `master` branch.


### More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- [Waterline (ORM)](http://github.com/balderdashy/waterline)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>


### License

**[MIT](./LICENSE)**
&copy; 2014
[Mike McNeil](http://michaelmcneil.com), [Scott Gress](https://github.com/sgress454), [Balderdash](http://balderdash.co) & contributors

This module is part of the [Sails framework](http://sailsjs.org), and is free and open-source under the [MIT License](http://sails.mit-license.org/).


![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png) 
 

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/a22d3919de208c90c898986619efaa85 "githalytics.com")](http://githalytics.com/balderdashy/file-parser)
