/*!
* The iPED Toolkit
* Node.js Webserver
*
* (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*
* Voice control
* (c) 2015 Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*/

/*********************************************************************************************
 Table of content
 *********************************************************************************************
 1. Server-Settings
 3. API
    3.1 Locations:
         3.1.1 List all Locations
         3.1.2 Create a Location
         3.1.3 Retrieve a Location
         3.1.4 Edit a Location
         3.1.5 Remove a Location
         3.1.6 Retrieve all related Locations of a Location
    3.2 Relationships:
         3.2.1 Retrieve a Relationship by its Id
         3.2.2 Edit a Relationship by its Id
         3.2.3 Create a Relationship between two Locations
         3.2.4 Retrieve a Relationship between two Locations
         3.2.5 Edit a Relationship between two Locations
         3.2.6 Remove a Relationship by its Id
    3.3 Videos:
         3.3.1 List all Videos
         3.3.2 Create a Video
         3.3.3 Retrieve a Video
         3.3.4 Edit a Video
         3.3.5 Remove a Video
         3.3.6 Retrieve all Videos of a Location
    3.4 Overlays
         3.4.1 List all Overlays
         3.4.2 Create an Overlay
         3.4.3 Retrieve an Overlay
         3.4.4 Edit an Overlay
         3.4.5 Remove an Overlay
         3.4.6 Retrieve all Overlays of a Location
    3.5 Scenarios [!]
         3.5.1 List all Scenarios [!]
         3.5.2 Create a Scenario [!]
         3.5.3 Retrieve a Scenario [!]
         3.5.4 Edit a Scenario [!]
         3.5.5 Remove a Scenario [!]

 [*] = not yet implemented
 [x] = in progress
 [!] = not yet defined and designed

 If there is a problem, you can contact the developer.
 So please write your name to your implemented function, e.g. "(Developer: Nicho)"
*********************************************************************************************/

'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util');

var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');

var log = require('./global/log');



/*********************************************************
 1. Server-Settings
 *********************************************************/
var VERSION = '0.0.2';
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

// Loading package "Express" for creating a webserver
// Morin: webRTC's screen sharing requires a SSL connection
// Morin: The default password for the server.key file is: morin
var options = {
    key : fs.readFileSync('./config/server.key'),
    cert : fs.readFileSync('./config/server.crt'),
    passphrase : 'morin'
};

log.info('iPED Toolkit Server %s', VERSION);


/****************************
 Express.js
 ****************************/
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

// Allow Access-Control-Allow-Origin
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/****************************
 Socket.io (websockets)
 ****************************/
var socketHandler = function(socket) {
    //log.debug({socket: socket}, 'New connection:');
    log.info('New connection');

    /*
        Emits newLoactionID for loading a new Video
     */
    socket.on('setLocationId', function(data) {
        log.debug({data: data}, 'Received data:');
        io.emit('setLocationId', data);
    });


    /*
        Reset Socket-Function for microphonePermission in Frontend
     */
    socket.on('resetFrontendMicPermission', function(data) {
        log.debug({data: data}, 'resetFrontendMicPermission:');
        io.emit('setMicPermission', data);
    });


    /*
        Getter Socket-Function for microphonePermission in Frontend
     */
    socket.on('getFrontendMicPermission', function() {
        log.debug('getFrontendMicPermission');
        var data = null;
        io.emit('getMicPermission', data);
        io.emit('getSelectedLanguage', data);
    });


    /*
        Recieves activating microphone command in Remote Control App
        Emits setup with corresponding language for Frontend
     */
    socket.on('activateMic', function(data) {
        log.debug({data: data}, 'Setup Microphone using language:');
        io.emit('setupMic', data);
    });

    /*
        Recieves microphone permission command from Frontend
        Emits setup with corresponding language for Remote Control App
        After microphone permission, the user can start recording voice commands by the Remote Control App
     */
    socket.on('setRemoteMicPermission', function(data) {
        log.debug({data: data}, 'setRemoteMicPermission to:');
        io.emit('setMicPermission', data);
    });

    /*
        Recieves microphone language from Frontend
     */
    socket.on('setSeletedLanguage', function(data) {
        log.debug({data: data}, 'setRemoteSelectedLanguage to:');
        io.emit('setRemoteSelectedLanguage', data);
    });

    /*
        Recieves microphone listening-status from Remote Control App
        Emits listening-status for Frontend (1 = start recording; 0 = stop recording)
     */
    socket.on('listen', function(data) {
        log.debug({data: data}, 'Microphone listening:');
        io.emit('listenMic', data);
    });

    /*
        Recieves witAi response from Frontend
        The understood intent will be compare with neo4J-intents for the current LocationID
        Special cases are empty LocationID, an empty Wit.Ai intent or an empty voice to text processing
     */
    socket.on('witResponse', function(data) {

        log.debug({data: data}, 'witResponse:');

        vc.checkVoiceCommand(data, function(err, res) {

            if(!err && typeof res == "number") {

                data.success = true;
                log.debug({data: res}, "relatedLocationID for emit:");

                data.id = res;
                io.emit('setLocationId', data);

            } else if (!err && typeof res == "string"){

                if(res == "sys_show_overlays") {
                    io.emit('changeShowHideOverlays', true);
                    io.emit('setShowHideOverlays', true);
                } else if(res == "sys_hide_overlays") {
                    io.emit('changeShowHideOverlays', false);
                    io.emit('setShowHideOverlays', false);
                } else {

                    data.success = false;
                    data.errMsg = res;

                    io.emit('failed', data);
                    io.emit('logger', data);

                }
            }
        });
    });

    /*
        Helper Socket-function for Logging (used in Frontend)
     */
    socket.on('beforeMainLogger', function(data) {

        io.emit('logger', data);

    });


    /*
        Helper Socket-function for Show/Hide Overlays (used in Remote)
     */
    socket.on('showHideOverlays', function(data) {

        log.debug({data: data}, 'showHideOverlays:');

        io.emit('setShowHideOverlays', data);

    });


    /*

     */
    socket.on('changeOverlayStatus', function(data) {

        io.emit('changeShowHideOverlays', data);

    });

};
var io = socketio.listen(httpServer);
io.on('connection', socketHandler);
var ios = socketio.listen(httpsServer);
ios.on('connection', socketHandler);


/*********************************************************
 webRTC
 *********************************************************/
// create the webRTC switchboard
var switchboard = require('rtc-switchboard')(httpsServer);

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function(req, res, next) {
    res.writeHead(200);
    fs.createReadStream(path.resolve(__dirname, 'public/lib/webRTC', 'webRTC.html')).pipe(res);
});

// serve the rest statically
//app.use(browserify('./public', {debug: false}));
app.get('/lib/webRTC/js/webRTC.js', function(req, res, next) {
    res.writeHead(200);
    var b = browserify();
    b.add('./public/lib/webRTC/js/webRTC.js');
    b.bundle().pipe(res);
});


/****************************
 Express.js
 ****************************/
// Finally, serve static content
app.use(express.static(__dirname + '/public'));


/*********************************************************
 3. API
 *********************************************************/

/****************************
 3.1 Locations
 ****************************/
var locations = require('./routes/locations')(app);

/****************************
 3.2 Relationships
 ****************************/
var relationships = require('./routes/relationships')(app);

/****************************
 3.3 Videos
 ****************************/
var videos = require('./routes/videos')(app);

/****************************
 3.4 Overlays
 ****************************/
var overlays = require('./routes/overlays')(app);

/****************************
 3.5 Scenarios
 ****************************/


/*********************************************************
 4. Voice Control
 *********************************************************/
var vc = require('./voiceControl/voiceCommands');
