/**
 * Module dependencies
 */

var deep = require('dot-access')
	, util = require('util');




var STRINGFILE = {
	
	warning: {
		
		paramArrivedTooLate:
		'Unable to expose body parameter `%s` in streaming upload!\n'+
		'Client tried to send a text parameter (%s) ' +
		'after one or more files had already been sent.\n'+
		'Make sure you always send text params first, then your files.\n'+
		'(In an HTML form, it\'s as easy as making sure your text inputs are listed before your file inputs.'

	},

	parser: {
		form: {
			onClose: 'Form: emitted `close`'
		}
	}
};


module.exports = {
	get: function (keypath, args) {
		args = (args && args.length) ? args : [];
		return util.format.apply(util, [deep.get(STRINGFILE, keypath)].concat(args));
	}
};