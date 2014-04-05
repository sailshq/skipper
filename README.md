# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

### Streaming Multipart File Upload Parsing 

Skipper is an opinionated variant of Connect's body parser designed to support streaming upload of monolithic files to a compatible blob receiver, while still allowing application code to run in a timely manner; without writing .tmp files to disk.

> This module may or may not be included as a part of the stable release of Sails v0.10-- we need more documentation, examples, and "receivers" (currently receivers for S3 and local disk exist.)

### With Sails


#### Installation

First, install this module in your project.

```sh
npm install skipper --save
```


This module is a drop-in replacement for the Connect bodyParser which is currently used by default in Sails and Express.  Therefore, we need to disable the default and hook up Skipper instead in `config/express.js`:

```javascript
  // ...
  bodyParser: require('skipper')
  // ...
```

#### Basic Usage







### Status

Currently, this project is in an openly released alpha stage, but under active development.


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
