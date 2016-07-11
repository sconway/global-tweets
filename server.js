// Require our dependencies
var express = require('express'),
  sentiment = require('sentiment'),
  exphbs    = require('express-handlebars'),
  http      = require('http'),
  mongoose  = require('mongoose'),
  twitter   = require('twitter'),
  path      = require('path'),
  config    = require('./config');

// Create an express instance and set a port variable
var app = express(),
    port = process.env.PORT || 1243,
    term;


// Disable etag headers on responses
app.disable('etag');

// Create a new ntwitter instance
var twit = new twitter(config.twitter);

// Set /public as our static content dir
app.use("/", express.static(__dirname + "/public"));

// Fire this bitch up (start our server)
var server = http.createServer(app).listen(port, function() {
  console.log('Express server listening on port ' + port);
});


// Index Route
app.get('/', function(req, res) {

  res.sendFile(path.join(__dirname, 'index.html'));

  // Initialize socket.io
  var io = require('socket.io').listen(server);

  // Filter based on a search term or nothing, if no term is provided
  term = req.query.term || ' ';

  // If there is already a stream, destroy it
  if (twit.currentTwitStream) {
    twit.currentTwitStream.destroy();
  }

  // Set a stream listener for tweets with geo location
  twit.stream('statuses/filter', { locations: '-180,-90,180,90' }, function(stream){
    // streamHandler(stream,io);
    stream.on('data', function(data) {

      if (data['user'] !== undefined) {

        // Construct a new tweet object if we have coordinates to use
        if (data['coordinates'] && data['text'].indexOf(term) >= 0) {
          
          var tweet = {
            twid: data['id_str'],
            active: false,
            author: data['user']['name'],
            avatar: data['user']['profile_image_url'],
            body: data['text'],
            date: data['created_at'],
            screenname: data['user']['screen_name'],
            coordinates: data['coordinates'],
            sentiment: sentiment(data['text'])
          };

          io.emit('tweet', tweet);
        }

      }

    });

    stream.on('error', function(error) {
      throw error;
    });

    twit.currentTwitStream = stream;
  });

});


