// Require our dependencies
var express = require('express'),
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

  term = req.query.term || 'a';

  if (twit.currentTwitStream) {
    twit.currentTwitStream.destroy();
  }

  // Set a stream listener for tweets matching tracking keywords
  twit.stream('statuses/filter', { track: 'a'}, function(stream){
    // streamHandler(stream,io);
    stream.on('data', function(data) {

      if (data['user'] !== undefined) {

        // Construct a new tweet object
        var tweet = {
          twid: data['id_str'],
          active: false,
          author: data['user']['name'],
          avatar: data['user']['profile_image_url'],
          body: data['text'],
          date: data['created_at'],
          screenname: data['user']['screen_name'],
          coordinates: data['coordinates']
        };

        // only send the tweet if it has a keyword
        // if (tweet.tone >= 0) {
        //   io.emit('tweet', tweet);
        //   console.log("tweet: ", data.text);
        // } else {
        //   console.log("uninteresting tweet");
        // }
        if (data['coordinates']) {
          io.emit('tweet', tweet);
          console.log(data['coordinates']);
          console.log(data['text']);
        }
      }
    });

    stream.on('error', function(error) {
      throw error;
    });

    twit.currentTwitStream = stream;
  });
});


function checkTweet(tweet) {
  var text   = tweet.toLowerCase(),
      isGood = text.indexOf("love") >= 0,
      isBad  = text.indexOf("hate") >= 0,
      isNeutral = isGood && isBad;

  if ( isNeutral ) {
      return 2;
  } else if ( isGood ) {
      return 1;
  }else if ( isBad ) {
      return 0;
  } else {
    return -1;
  }
}





