# Skipper Roadmap

This file contains the development roadmap & backlog for the Skipper project.

&nbsp;
&nbsp;

## Backlog

The backlog consists of approved proposals for useful features which are not currently in the immediate-term roadmap above, but would be excellent places to contribute code to Skipper. We would exuberantly accept a pull request implementing any of the items below, so long as it was accompanied with reasonable tests that prove it, and it doesn't break other core functionality. Please see the Sails/Skipper [contribution guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md) to get started.

> - If you would like to see a new feature or an enhancement to an existing feature in Skipper, please review the [Sails/Skipper contribution guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md). When you are ready, submit a pull request adding a new row to the bottom of this table.
> - In your pull request, please include a detailed proposal with a short summary of your use case, and a well-reasoned explanation of how you think that feature could be implemented.  Your proposal should include changes or additions to usage, expected return values, and any errors or exit conditions.
> - Once your pull request has been created, add an additional commit which links to it from your new row in the table below.



Feature                                          | Proposal                                                                              | Summary
 :---------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------
| Improve non-mpu body parser                    |  [#25](https://github.com/balderdashy/skipper/issues/25) | Use https://github.com/expressjs/body-parser for non-mpu things based on [Doug's suggestions](https://github.com/expressjs/body-parser/issues/28).


&nbsp;
&nbsp;


## Pending Proposals

The backlog items below are from before the recent change to the Sails project's (and consequently Skipper's) contribution guidelines, and are suggestions for features or enhancements, but are not yet accompanied by a complete proposal.  Before any of the following backlog items can be implemented or a pull request can be merged, a detailed proposal needs to be submitted, discussed and signed off on by the project maintainers.  For information on writing a proposal, see the [Sails/Skipper contribution guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md).  **Please do not submit a pull request _adding_ to this section.**

> - If you are interested in seeing one of the features or enhancements below in Sails core, please create a new pull request moving the relevant item from here to the "Backlog" table with additional details about your use case (see the [updated contribution guide]() for more information about submitting proposals).


Feature                                                     | Summary
 :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  `acceptFile` lifecycle callback                     | allow a function to be optionally passed in as an option to `.upload()`.  This fn is called repeatedly- each time a new incoming file upload arrives on the upstream.  It is passed metadata about that multipart upload including its proclaimed size, MIME type, etc., and its responsibility is to decide whether to (i) start uploading the file (ii) ignore the file, throwing away its incoming bytes, but allowing it to continue in order to handle the other files, or (iii) terminate the request entirely.  This could work a lot like the `accept` callback provided by socket.io that determines whether or not to allow an incoming socket to connect. Function signature:  `acceptFile: function (fileMetadata,cb){}`, where, at least to start with, `fileMetadata` is a simple object with three properties: a numeric `size` (in bytes), a string `type` (MIME type), and a string `filename`. To accept an incoming file, call `cb(null, true)`.  To ignore a file, call `cb(null, false)`. And to terminate, giving up on the entire file upload request altogether, call `cb(new Error('some helpful error'))`.  If terminated, the callback to `.upload()` will be triggered with a truthy `err` argument. See https://github.com/balderdashy/skipper/issues/54#issuecomment-72048398 for details.
 proper garbage-collection support in core                | garbage-collect failed file uploads using the adapter's rm() method (if one exists- otherwise emit a warning)
 expose `write` method                |  replace `receive()` with `write()` in order to simplify adapter development.  This will also make a lot of the other stuff on the list below easier, particularly progress events.
 normalized upload progress events in core                |  remove the progress stream stuff from skipper-disk and include it in core (pipe to it, like the renamer pump)
 support for maxBytes quota enforcement in core           | this is currently implemented at the adapter level.  would be better to have on-the-fly maxBytes enforcement on a per-upstream or per-file-in-upstream basis
 more documentation for adapter implementors                | document the method signatures/expected results/etc. for the adapter methods, from an implementation perspective
 usage documentation for ls(), rm(), read()           | document the method signatures/expected results/etc. for these methods in userland
 expose a static Upstream factory on the skipper module   |  useful for streaming from one fsadapter to another (i.e. not just for file uploads)
 expose a static Downstream factory on the skipper module |  useful for multi-file download from fsadapters
 expose an API for building Downstream reducer pumps      |  i.e. so you can coalesce a multi-file download into a zip archive
 streaming compression (zlib)                    |  transport stream to compress file uploads on their way to the remote filesystem, and decomopress them on the way out
 streaming encryption (crypto)                   |  transport stream to encrypt file uploads on their way to the remote filesystem, and decrypt them on the way out
 streaming thumbnail support for image uploads   |  transport stream to create thumbnails from streaming files on the fly, then also persist those thumbails to the remote filesystem.  Returned metadata needs to provide file descriptors (`fd`s) for each thumbnail.




