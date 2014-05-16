/* jshint node: true */
'use strict';

/**
  # rtcio-demo-quickconnect

  This is a starter project for working with [WebRTC](http://webrtc.org).

  ## Getting Started

  First, clone this repository:

  ```
  git clone https://github.com/rtc-io/rtcio-demo-quickconnect.git
  ```

  Next, install node dependencies:

  ```
  cd rtcio-demo-quickconnect
  npm install
  ```

  Once the dependencies have been installed, you should then be able to run
  the demonstration server:

  ```
  npm start
  ```

  If everything has worked correctly, you should now be able to open your
  browser to the following url:

  <http://localhost:3000/>

  You can test that you have WebRTC peer connections operating correctly by
  opening two browser windows to the same url; or, you can find someone else
  that has access to your machine and point them to: <http://your.ip:3000/>.
  All being well you should be able to communicate with that person using
  WebRTC!

**/

var fs = require('fs');
var path = require('path');
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var app = express();

var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

var server = require('https').Server(options, app);
var browserify = require('browserify-middleware');
var serverPort = process.env.NODE_PORT || 3000;

// create the switchboard
var switchboard = require('rtc-switchboard')(server);

// convert stylus stylesheets
app.use(stylus.middleware({
  src: __dirname + '/site',
  compile: function(str, sourcePath) {
    return stylus(str)
      .set('filename', sourcePath)
      .set('compress', false)
      .use(nib());
  }
}));


app.get('/', function(req, res) {
  res.redirect(req.uri.pathname + 'room/main/');
});

// serve the rest statically
app.use(browserify('./site', { debug: true }));
app.use(express.static(__dirname + '/site'));

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function(req, res, next) {
  res.writeHead(200);
  fs.createReadStream(path.resolve(__dirname, 'site', 'index.html')).pipe(res);
});

// start the server
server.listen(serverPort, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }

  console.log('server running on port: ' + serverPort);
});
