var Express = require('express')
  , path = require('path')
  , Receiver = require('../diskReceiver')
  , FileParser = require('../..');
require('colors');

// Lift express server with a file upload route.
var app = Express();
app.use( FileParser() );
app.post('/upload', function uploadAction (req, res) {
  req.file('avatar').upload( Receiver() , function (err, files) {
    if (err) return res.send(500, err);
    return res.json({
      message: files.length + ' file(s) uploaded successfully!',
      files: files
    });
  });
});

app.listen(3000).on('listening', function (err) {
  console.log(
  'Send a multipart form upload with a file in the `avatar` field to '+
  'http://localhost:3000/upload'.underline
  );
});
