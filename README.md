# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

### Streaming Multipart File Upload Parsing 

Skipper is an opinionated variant of Connect's body parser designed to support streaming upload of monolithic files to a compatible blob receiver, while still allowing application code to run in a timely manner; without writing .tmp files to disk.

> This module ~~may~~ **will** be included as a part of the stable release of Sails v0.10.  However we need help with documentation, examples, and writing additional receivers (currently receivers for S3 and local disk exist.)
> The decision to include skipper in v0.10 was tough-- it has stalled our release.  However, it was a consequence of rewriting this module to use streams2, as well as the spotty/fragmented/confusing state of file uploads around the community.  We hope this module helps clear things up for everypony.


### Installation

```sh
npm install skipper --save
```

### Setup

This module is a drop-in replacement for the Connect bodyParser which is currently used by default in Sails and Express.  Therefore, we need to disable the default and hook up Skipper instead.

#### With Sails

In `config/express.js`:

```javascript
  // ...
  bodyParser: require('skipper')
  // ...
```

#### With Express

In the file where you set up your middleware:

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
    var SomeReceiver = require('../receivers/someReceiver');
    req.file('avatar').upload( SomeReceiver() , function (err, files) {
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
  var SomeReceiver = require('./receivers/someReceiver');
  req.file('avatar').upload( SomeReceiver() , function (err, files) {
    if (err) return res.send(500, err);
    return res.json({
      message: files.length + ' file(s) uploaded successfully!',
      files: files
    });
  });
});
```

### Status

Currently, this project is in beta, and openly released on npm.  Development takes place on the `master` branch.


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
