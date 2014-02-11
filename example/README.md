# example

a [Sails](http://sailsjs.org) application

## How to use

Lift this example app, then send a `form-data` (e.g. multipart) POST request to [http://localhost:1337/file/upload](http://localhost:1337/file/upload).  By default, uploaded file(s) will be uploaded to the app's `.tmp` folder.

To test the S3 (or other blob) adapters, just change `config/connections.js`.



> **Do you use POSTman?**
>
> Here is a POSTman collection with an example upload request you can send to test this example:
> https://www.getpostman.com/collections/7ca6b5331838b5320c5e