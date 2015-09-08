/*!
* The IPED Toolkit
* Node.js Webserver
*
* (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*
* Voice control
* (c) 2015 Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*/

'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util');

var express = require('express');
var basicAuth = require('basic-auth');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');

var Websockets = require('./global/websockets');
var log = require('./global/log');



/*********************************************************
 Server-Settings
 *********************************************************/
var VERSION = '0.0.2';
log.info('IPED Toolkit Server %s', VERSION);

var HTTP_PORT = 8080;
var HTTPS_PORT = 8443;

// Pass console parameters (e.g., server port passed by Jenkins)
process.argv.forEach(function(val, index, array) {
    if (val.indexOf('http=') != -1) {
        HTTP_PORT = val.split('=')[1];
    }
    if (val.indexOf('https=') != -1) {
        HTTPS_PORT = val.split('=')[1];
    }
});


/****************************
 Express.js
 ****************************/
var options = {
    key : fs.readFileSync('./config/server.key'),
    cert : fs.readFileSync('./config/server.crt')
};

var app = express();
app.use(bodyParser());
app.use(function(err, req, res, next) {
    res.end('There is a syntax error in your request: ' + err.toString());
});
app.use(function(req, res, next) {
    req.log = log.child({BODY: req.body, QUERY: req.query});
    next();
});

var httpsServer = require('https').Server(options, app);
httpsServer.on('error', function(error) {
    log.error({error: error}, 'Error starting HTTPS server:');
});
httpsServer.listen(HTTPS_PORT, function() {
    log.info('HTTPS server started on port %d', HTTPS_PORT);
});

var httpServer = require('http').Server(app);
httpServer.on('error', function(error) {
    log.error({error: error}, 'Error starting HTTP server:');
});
httpServer.listen(HTTP_PORT, function() {
    log.info('HTTP server started on port %d', HTTP_PORT);
});

var auth = function(req, res, next) {
    var user = basicAuth(req);
    if (user && user.name == "sitcomlab" && user.pass == "sitcomlab") {
        return next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    }
};

var switchboard = require('rtc-switchboard')(httpsServer);
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function(req, res, next) {
    res.writeHead(200);
    fs.createReadStream(path.resolve(__dirname, 'public/lib/webRTC', 'webRTC.html')).pipe(res);
});

app.get('/lib/webRTC/js/webRTC.js', function(req, res, next) {
    res.writeHead(200);
    var b = browserify();
    b.add('./public/lib/webRTC/js/webRTC.js');
    b.bundle().pipe(res);
});

app.use('/', auth);
app.use('/', express.static(__dirname + '/public'));


/****************************
 Socket.io
 ****************************/
var socketHandler = function(socket) {
    //log.debug({socket: socket}, 'New connection:');
    log.info('New connection');

    socket.on('setLocationId', function(data) {
        log.debug({data: data}, 'Received data:');
        websockets.emit('[IPED]setLocationId', data);
    });
    
    socket.on('showHideOverlays', function(data) {
        log.debug({data: data}, 'showHideOverlays:');
        websockets.emit('[IPED]setShowHideOverlays', data);
    });

    socket.on('changeOverlayStatus', function(data) {
        websockets.emit('[IPED]changeShowHideOverlays', data);
    });

    socket.on('beforeMainLogger', function(data) {
        websockets.emit('[Logger]', data);
    });

    voiceControl.listenTo({websockets: websockets,
                           socket: socket
    });
};
var websockets = new Websockets({httpServer: httpServer,
                                 httpsServer: httpsServer
});
websockets.on('connection', socketHandler);


 /*********************************************************
  IPED Toolkit API
  *********************************************************/
var locations = require('./routes/locations')(app);
var relationships = require('./routes/relationships')(app);
var videos = require('./routes/videos')(app);
var overlays = require('./routes/overlays')(app);


 /*********************************************************
  IPED Toolkit Plugins
  *********************************************************/
var VoiceControl = require('./plugins/voiceControl');
var voiceControl = new VoiceControl();
var Kinect = require('./plugins/kinect');
var kinect = new Kinect({websockets: websockets});
