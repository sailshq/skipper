module.exports = async function(err, req, res, next) {
  if (req.query.status === 'error') {
    throw new Error('err!');
  }
  try {
    await dumb(req.query.status);
    return res.send('ok');
  } catch (e) {
    return res.send('err');
  }
};

// Define a dumb async function.
var dumb = function (status) {
  return new Promise(function (resolve, reject) {
    setTimeout(function() {
      if (status === 'ok') {
        return resolve();
      }
      if (status === 'reject') {
        return reject();
      }
    }, 100);
  });
};

