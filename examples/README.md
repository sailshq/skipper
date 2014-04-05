# Using Skipper w/ Sails: A Tutorial

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

