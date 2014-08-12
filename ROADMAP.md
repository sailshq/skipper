# Module Dashboard

The build status, immediate-term plans, and future goals of this repository.

> ###### Feature Requests
> 
> We welcome feature requests as edits to the "Backlog" section below.
>
> Before editing this file, please check out [How To Contribute to ROADMAP.md](https://gist.github.com/mikermcneil/bdad2108f3d9a9a5c5ed)- it's a quick read :)


## Current Build Status

The current Travis test output for this repository.

| Release                                                                                                                 | Install Command                                                | Build Status
|------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | -----------------
| [![NPM version](https://badge.fury.io/js/skipper.png)](https://github.com/balderdashy/skipper/tree/stable) _(stable)_  | `npm install skipper`                                          | [![Build Status](https://travis-ci.org/balderdashy/skipper.png?branch=stable)](https://travis-ci.org/balderdashy/skipper) |
| [edge](https://github.com/balderdashy/skipper/tree/master)                                                              | `npm install skipper@git://github.com/balderdashy/skipper.git` | [![Build Status](https://travis-ci.org/balderdashy/skipper.png?branch=master)](https://travis-ci.org/balderdashy/skipper) |

#### Skipper-Compatible Filesystem Adapters

| Module                       | Build Status (edge)                                                                                                                     | Latest Stable Version
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------
| [skipper-disk](https://github.com/balderdashy/skipper-disk)                 | [![Build Status](https://travis-ci.org/balderdashy/skipper-disk.png?branch=master)](https://travis-ci.org/balderdashy/skipper-disk)     | [![NPM version](https://badge.fury.io/js/skipper-disk.png)](https://www.npmjs.org/package/skipper-disk)
| [skipper-s3](https://github.com/balderdashy/skipper-s3)                   | [![Build Status](https://travis-ci.org/balderdashy/skipper-s3.png?branch=master)](https://travis-ci.org/balderdashy/skipper-s3)         | [![NPM version](https://badge.fury.io/js/skipper-s3.png)](https://www.npmjs.org/package/skipper-s3)
| [skipper-gridfs](https://github.com/willhuang85/skipper-gridfs)               | [![Build Status](https://travis-ci.org/willhuang85/skipper-gridfs.png?branch=master)](https://travis-ci.org/willhuang85/skipper-gridfs) | [![NPM version](https://badge.fury.io/js/skipper-gridfs.png)](https://www.npmjs.org/package/skipper-gridfs)

> Need support for a different remote filesystem, or just interested in writing your own adapter?
>
> First read up on [how Skipper works](https://github.com/balderdashy/skipper#background), then check out [the spec](https://github.com/balderdashy/skipper#what-are-filesystem-adapters) to get started making your own adapter.



## Roadmap

Our short-to-medium-term roadmap items, in order of descending priority:

_(feel free to suggest things)_

 Feature                                                  | Owner                                                                            | Details     
 :------------------------------------------------------- | :------------------------------------------------------------------------------- | :------
 proper garbage-collection support in core                | [@mikermcneil](https://github.com/mikermcneil)                                   | garbage-collect failed file uploads using the adapter's rm() method (if one exists- otherwise emit a warning)
 expose `write` method                | [@mikermcneil](https://github.com/mikermcneil)                                   | replace `receive()` with `write()` in order to simplify adapter development.  This will also make a lot of the other stuff on the list below easier, particularly progress events.
 normalized upload progress events in core                | [@mikermcneil](https://github.com/mikermcneil)                                   | remove the progress stream stuff from skipper-disk and include it in core (pipe to it, like the renamer pump)
 support for maxBytes quota enforcement in core           | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | on-the-fly maxBytes enforcement on a per-upstream basis
 more documentation for adapter implementors                |                                    | document the method signatures/expected results/etc. for the adapter methods, from an implementation perspective
 usage documentation for ls(), rm(), read()           |                                    | document the method signatures/expected results/etc. for these methods in userland
 expose a static Upstream factory on the skipper module   | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | useful for streaming from one fsadapter to another (i.e. not just for file uploads)
 expose a static Downstream factory on the skipper module | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | useful for multi-file download from fsadapters
 expose an API for building Downstream reducer pumps      | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | i.e. so you can coalesce a multi-file download into a zip archive


#### Backlog

The backlog consists of features which are not currently in the immediate-term roadmap above, but are useful.  We would exuberantly accept a pull request implementing any of the items below, so long as it was accompanied with reasonable tests that prove it, and it doesn't break other core functionality.

 Feature                                         | Owner                                                                            | Details     
 :---------------------------------------------- | :------------------------------------------------------------------------------- | :------
 streaming compression (zlib)                    | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | transport stream to compress file uploads on their way to the remote filesystem, and decomopress them on the way out
 streaming encryption (crypto)                   | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | transport stream to encrypt file uploads on their way to the remote filesystem, and decrypt them on the way out
 streaming thumbnail support for image uploads   | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | transport stream to create thumbnails from streaming files on the fly, then also persist those thumbails to the remote filesystem.  Returned metadata needs to provide file descriptors (`fd`s) for each thumbnail.
 use https://github.com/expressjs/body-parser for non-mpu things | [_want to help?_](https://github.com/balderdashy/skipper/edit/master/ROADMAP.md) | https://github.com/balderdashy/skipper/issues/25
