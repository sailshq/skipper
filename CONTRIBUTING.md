# Contributing to Skipper

Skipper follows the [Contribution Guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md) from the Sails project.

The [contribution guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md) is designed to help you get off the ground quickly contributing to Waterline. Reading it thoroughly will help you write useful issues, make eloquent proposals, and submit top-notch patches that can be merged quickly. Respecting the guidelines laid out in the guide helps make the core maintainers of Skipper more productive, and makes the experience of working with Skipper positive and enjoyable for the community at large.

If you are working on a pull request, **please carefully read the [contribution guide](https://github.com/balderdashy/sails/blob/master/CONTRIBUTING.md) from top to bottom**. In case of doubt, open an issue in the issue tracker or contact someone from our [core team](https://github.com/balderdashy/sails#team) on Twitter. Especially do so if you plan to work on something big. Nothing is more frustrating than seeing your hard work go to waste because your vision does not align with planned or ongoing development efforts of the project's maintainers.


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
