/**
 * example.js
 *
 * This file contains some example browser-side JavaScript for connecting
 * to your Sails backend using Socket.io.
 *
 * It is designed to get you up and running fast, but it's just an example.
 * Feel free to change none, some, or ALL of this file to fit your needs!
 *
 * For an annotated version of this example, see:
 *   *-> https://gist.github.com/mikermcneil/8465536
 */


// Immediately start connecting
socket = io.connect();

typeof console !== 'undefined' &&
console.log('Connecting Socket.io to Sails.js...');

// Attach a listener which fires when a connection is established:
socket.on('connect', function socketConnected() {

  typeof console !== 'undefined' &&
  console.log(
    'Socket is now connected and globally accessible as `socket`.\n' +
    'e.g. to send a GET request to Sails via Socket.io, try: \n' +
    '`socket.get("/foo", function (response) { console.log(response); })`'
  );


  // Subscribe to the Sails "firehose",  a development tool
  // which lets you watch pubsub messsages emitted from your
  // Sails models on the backend.
  socket.get('/firehose', function nowListeningToFirehose () {
    
    // Attach a listener which fires every time the server publishes
    // a message to the firehose:
    socket.on('firehose', function newMessageFromSails ( message ) {
      typeof console !== 'undefined' &&
      console.log('New message published from Sails ::\n', message);
    });
  });


  // For your app code, you'll want to use the more
  // specific model events, e.g.
  socket.on('user', function (msg) {
    
    // ...
    console.log('New message for subscribers to user ' + msg.id);
    console.log(msg.verb);
    console.log(msg.data);
    // ...

    //
    // See http://links.sailsjs.org/docs/pubsub for details.
    // 
  });
});
