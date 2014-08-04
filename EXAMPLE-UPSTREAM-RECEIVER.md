# Simplified example

It is helpful to look at a somewhat simplified example of the `receive()` method defined in Skipper FSadapters:

```js
module.exports = function receive(options) {
  var receiver__ = WritableStream({ objectMode: true });
  receiver__._write = function onFile(__newFile, unused, done) {
    if (!__newFile.fd.match(/^\//)) {
      __newFile.fd = path.resolve(__newFile.fd);
    }

    fsx.mkdirs(path.dirname(__newFile.fd), function(mkdirsErr) {
      if (mkdirsErr) return done(mkdirsErr);

      var outs__ = fsx.createWriteStream(__newFile.fd);
      outs__.on('finish', function successfullyWroteFile() {
        done();
      });
      __newFile.pipe(outs__);
    });
  };
  return receiver__;
};
```


### Food for thought

We could change the fsadapter api to define a `writeFile` method instead-- something like:

```js
module.exports = function writeFile(__newFile) {
  if (!__newFile.fd.match(/^\//)) {
    __newFile.fd = path.resolve(__newFile.fd);
  }
  fsx.mkdirs(path.dirname(__newFile.fd), function(err) {
    if (err) return __newFile.emit('error', err);
    __newFile.pipe(fsx.createWriteStream(__newFile.fd));
  });
};
```

This has 3 main advantages:

+ It is more concise.
+ No need to worry about the `done` callback.  Just pipe the __newFile stream some place.
+ No need to worry about instantiating your own object-mode write stream.

We could also still keep support for the `.receive()` method-- obviously for backwards-compatibility, but also as a way to offer a lower-level api while still allowing for easier integration using `.writeFile()`.

