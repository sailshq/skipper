/**
 * Closely based on TJ Holawaychuk's node-pause
 * https://github.com/visionmedia/node-pause
 * License: MIT
 */

module.exports = function(obj) {
  var onClose, onData, onEnd, events = [];

  // buffer data
  obj.on('data', onData = function(data, encoding) {
    events.push(['data', data, encoding]);
  });

  // buffer end
  obj.on('end', onEnd = function(data, encoding) {
    events.push(['end', data, encoding]);
  });

  // buffer error
  obj.on('error', onError = function(data, encoding) {
    events.push(['error', data, encoding]);
  });

  // buffer close
  obj.on('close', onClose = function(d) {
    events.push(['close']);
  });


  function end () {
    obj.removeListener('data', onData);
    obj.removeListener('end', onEnd);
    obj.removeListener('error', onError);
    obj.removeListener('close', onClose);
  }

  function resume () {
    end();
    for (var i = 0, len = events.length; i < len; ++i) {
      obj.emit.apply(obj, events[i]);
    }
  }

  return {
    end: end,
    resume: resume
  };
};