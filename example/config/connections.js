/**
 * Connections
 * 
 * The `connections` configuration object lets you create different global "saved settings"
 * that you can mix and match in your models.  The `default` option indicates which 
 * "saved setting" should be used if a model doesn't have a connection specified.
 *
 * Note: If you're using version control, you should put your passwords/api keys 
 * in `config/local.js`, not here, in case you inadvertently push them up to your repository.
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#documentation
 */

module.exports.connections = {

  // Local disk storage for file uploads.
  tmpDirectoryOnLocalFilesystem: {
    adapter: 'sails-local-fs',
    pathPrefix: '.tmp/foo'
  },


  // Local disk storage for DEVELOPMENT ONLY
  //
  // Installed by default.
  //
  localDiskDb: {
    adapter: 'sails-disk'
  }
};




