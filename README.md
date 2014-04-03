# [![Skipper](http://i.imgur.com/P6gptnI.png)](https://github.com/balderdashy/skipper)

[![NPM version](https://badge.fury.io/js/skipper.png)](http://badge.fury.io/js/skipper) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper.svg?branch=master)](https://travis-ci.org/balderdashy/skipper)

### Streaming Multipart File Upload Parsing 

Skipper is an opinionated variant of Connect's body parser designed to support streaming upload of monolithic files to a compatible blob receiver, while still allowing application code to run in a timely manner; without writing .tmp files to disk.


This module may or may not be included as a part of the stable release of Sails v0.10-- need more documentation, examples, and "receivers" (currently receivers for S3 and local disk exist.)

#### Usage

##### With Sails

Install it with npm using the `--save` flag.  This will automatically add it to your app's package.json file. 

```sh

npm install --save

```

Skipper intends to be a drop-in replacement for the Connect Body Parser which Sails uses by default (via Express.js).  

Therefore, the next step is to disable it and hook up Skipper.


###### Change Config

Do this by adding the line `bodyParser: require('skipper')` to the `express` object in `/myApp/config/express.js`.  It should look something like this.

```javascript

/**
 * Configure advanced options for the Express server inside of Sails.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.express = {

 // ... much comment.  so amaze. wow
 
	// Defaults to a slightly modified version of `express.bodyParser`, i.e.:
	// If the Connect `bodyParser` doesn't understand the HTTP body request 
	// data, Sails runs it again with an artificial header, forcing it to try
	// and parse the request body as JSON.  (this allows JSON to be used as your
	// request data without the need to specify a 'Content-type: application/json'
	// header)
	// 
	// If you want to change any of that, you can override the bodyParser with
	// your own custom middleware:
	bodyParser: require('skipper')

};


/**
 * HTTP Flat-File Cache
 * 
 * These settings are for Express' static middleware- the part that serves
 * flat-files like images, css, client-side templates, favicons, etc.
 *
 * ... more comments ...
 */
module.exports.cache = {

	// The number of seconds to cache files being served from disk
	// (only works in production mode)
	maxAge: 31557600000
};


```

###### Create an API

Now that it's hooked up, we need to generate a new `api` for serving/storing the files.  Do this using the sails command line tool.

```sh

dude@littleDude:~/node/myApp$ sails generate api file

debug: Generated a new controller `file` at api/controllers/FileController.js!
debug: Generated a new model `File` at api/models/File.js!

info: REST API generated @ http://localhost:1337/file
info: and will be available the next time you run `sails lift`.

dude@littleDude:~/node/myApp$ 

```

###### Write Controller Actions

Refer to `myApp/api/controllers/FileController.js` below and modify it as you see fit.

```javascript 
// myApp/api/controllers/FileController.js

/**
 * FilesController.js 
 *
 * @description ::
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

  index: function (req,res){

    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
      '<form action="http://localhost:1337/files/upload" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="avatar" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    )
  },
  upload: function (req,res){

var Writable = require('stream').Writable;
var fs = require('fs');

    function newReceiverStream (options) {
        options = options || {};

        // Default the output path for files to `/dev/null` if no `id` option
        // is passed in (for testing purposes only)
        var filePath = options.id || '/dev/null';

        var receiver__ = Writable({objectMode: true});

        // This `_write` method is invoked each time a new file is received
        // from the Readable stream (Upstream) which is pumping filestreams
        // into this receiver.  (filename === `__newFile.filename`).
        receiver__._write = function onFile (__newFile, encoding, done) {
        var outs = fs.createWriteStream(filePath, encoding);
        __newFile.pipe(outs);

        // Garbage-collect the bytes that were already written for this file.
        // (called when a read or write error occurs)
        function gc (err) {
          console.log('************** Garbage collecting file `'+__newFile.filename+'` located @ '+filePath+'...');
          fs.unlink(filePath, function (gcErr) {
            if (gcErr) return done([err].concat([gcErr]));
            return done(err);
          });
        }


        __newFile.on('error', function (err) {
          console.log('***** READ error on file '+__newFile.filename, '::',err);
        });
        outs.on('error', function failedToWriteFile (err) {
        	console.log('OH THE BITS',__newFile,'enc',encoding,'dun',done);
          gc(err);
        });

        outs.on('finish', function successfullyWroteFile () {
          done();
        });

        };

        return receiver__;
    }
    
var streamOptions = {id:'/home/dude/node/fileUploadExample/assets/images/shitBird.jpeg'};
    req.file('avatar').upload( newReceiverStream(streamOptions) , function (err, files) {
          if (err) return res.serverError(err);
        
          res.json({
            message: files.length + ' file(s) uploaded successfully!',
            files: files
          });

        });
  }

};


```

##### With Express

You're on your own, homie... nah, it's comin'


#### Status

Currently, this project is in an openly released alpha stage, but under active development.


#### More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- [Waterline (ORM)](http://github.com/balderdashy/waterline)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>



#### License

**[MIT](./LICENSE)**
&copy; 2014
[Mike McNeil](http://michaelmcneil.com), [Scott Gress](https://github.com/sgress454), [Balderdash](http://balderdash.co) & contributors

[Sails](http://sailsjs.org) is free and open-source under the [MIT License](http://sails.mit-license.org/).


![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png) 
 

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/a22d3919de208c90c898986619efaa85 "githalytics.com")](http://githalytics.com/balderdashy/file-parser)
