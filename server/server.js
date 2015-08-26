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
var basicAuth = require('basic-auth');
var socketio = require('socket.io');
var dgram = require("dgram");
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


/****************************
 Server-Authentication
 ****************************/
 var auth = function(req, res, next){
     var user = basicAuth(req);
     if(user && user.name == "sitcomlab" && user.pass == "sitcomlab")
         return next();
     else{
         res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
         return res.send(401);
     }
 };


/****************************
 Socket.io (websockets)
 ****************************/
var mysocket = 0;
var socketHandler = function(socket) {
    //log.debug({socket: socket}, 'New connection:');
    log.info('New connection');

    mysocket = socket;

    /**
     * THE FOLLOWING COMMAND BELONGS TO GENERAL
    **/

    // EMIT NEW LOCATION-ID FOR LOADING A NEW VIDEO
    socket.on('setLocationId', function(data) {
        log.debug({data: data}, 'Received data:');
        io.emit('setLocationId', data);
    });


    /**
     * THE FOLLOWING COMMANDS BELONGS TO VOICE-CONTROL
    **/

    // RESET FOR MICROPHONE-PERMISSION IN FRONDEND
    socket.on('resetFrontendMicPermission', function(data) {
        log.debug({data: data}, 'resetFrontendMicPermission:');
        io.emit('setMicPermission', data);
    });

    // GET MICROPHONE-PERMISSION IN FRONTEND
    socket.on('getFrontendMicPermission', function() {
        log.debug('getFrontendMicPermission');
        var data = null;
        io.emit('getMicPermission', data);
        io.emit('getSelectedLanguage', data);
    });

    // SETUP-FUNCTION IN REMOTE-CONTROL-APP (ACTIVATES MIRCOPHONE IN FRONTEND WITH SELECTED LANGUAGE)
    socket.on('activateMic', function(data) {
        log.debug({data: data}, 'Setup Microphone using language:');
        io.emit('setupMic', data);
    });

    // RECIEVES MICROPHONE-PERMISSION FROM FRONTEND FOR FINISHING SETUP-PROCESS IN REMOTE-CONTROL-APP
    socket.on('setRemoteMicPermission', function(data) {
        log.debug({data: data}, 'setRemoteMicPermission to:');
        io.emit('setMicPermission', data);
    });

    // RECIEVES SELECTED MICROPHONE-LANGUAGE FROM FRONTEND
    socket.on('setSeletedLanguage', function(data) {
        log.debug({data: data}, 'setRemoteSelectedLanguage to:');
        io.emit('setRemoteSelectedLanguage', data);
    });

    // RECIEVES MICROPHONE-LISTENING-STATUS FROM REMOTE-CONTROL-APP (1=START RECORDING; 0=STOP RECORDING) TO RECORD VOICE-COMMAND IN FRONTEND
    socket.on('listen', function(data) {
        log.debug({data: data}, 'Microphone listening:');
        io.emit('listenMic', data);
    });

    //  RECIEVES WIT.AI RESPONSE WITH RECOGNIZED COMMAND (=INTENT) IN FRONTEND AND STARTS ALGORITHM TO FIND INTENT IN DATABASE
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

    // LOGGING (USED IN FRONTEND)
    socket.on('beforeMainLogger', function(data) {
        io.emit('logger', data);
    });

    // SHOW/HIDE OVERLAYS (USED IN REMOTE-APP)
    socket.on('showHideOverlays', function(data) {
        log.debug({data: data}, 'showHideOverlays:');
        io.emit('setShowHideOverlays', data);
    });

    // SHOW HIDE OVERLAYS
    socket.on('changeOverlayStatus', function(data) {
        io.emit('changeShowHideOverlays', data);
    });


    /**
     * THE FOLLOWING COMMANDS BELONGS TO MIA
    **/

    // SHOW AVATAR
    socket.on('show_avatar', function(data) {
        log.debug({data: data}, 'show_avatar:');
        io.emit('showAvatar', data);
    });

    // HIDE AVATAR
    socket.on('hide_avatar', function(data) {
        log.debug({data: data}, 'hide_avatar:');
        io.emit('hideAvatar', data);
    });

    // MOVE AVATAR UP
    socket.on('move_up', function(data) {
        log.debug({data: data}, 'move_up:');
        io.emit('moveAvatarUp', data);
    });

    // MOVE AVATAR DOWN
    socket.on('move_down', function(data) {
        log.debug({data: data}, 'move_down:');
        io.emit('moveAvatarDown', data);
    });

    // MOVE AVATAR TO THE LEFT
    socket.on('move_left', function(data) {
        log.debug({data: data}, 'move_left:');
        io.emit('moveAvatarLeft', data);
    });

    // MOVE AVATAR TO THE RIGHT
    socket.on('move_right', function(data) {
        log.debug({data: data}, 'move_right:');
        io.emit('moveAvatarRight', data);
    });

    // MOVE AVATAR FRONTWARD
    socket.on('scale_up', function(data) {
        log.debug({data: data}, 'scale_up:');
        io.emit('scaleAvatarUp', data);
    });

    // MOVE AVATAR BACKWARD
    socket.on('scale_down', function(data) {
        log.debug({data: data}, 'scale_down:');
        io.emit('scaleAvatarDown', data);
    });

};
var io = socketio.listen(httpServer);
io.on('connection', socketHandler);
var ios = socketio.listen(httpsServer);
ios.on('connection', socketHandler);


/****************************
 udp server on 41181
 ****************************/

var PORT = 33333;
var HOST = '127.0.0.1';

//var dgram = require('dgram');
var UDPserver = dgram.createSocket('udp4');

UDPserver.on('listening', function () {
    var address = UDPserver.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

UDPserver.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    if (mysocket !== 0) {
        if(message == "up"){
            io.emit('moveAvatarUp', "");
        } else if(message == "down"){
            io.emit('moveAvatarDown', "");
        } else if(message == "left"){
            io.emit('moveAvatarLeft', "");
        } else if(message == "right"){
            io.emit('moveAvatarRight', "");
        }

        //socketHandler.emit('move_up', "" + msg);
        //socketHandler.broadcast.emit('field', "" + msg);
    }
});

UDPserver.bind(PORT);
//UDPserver.bind(PORT, HOST);


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
app.use('/', auth);
app.use('/', express.static(__dirname + '/public'));

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
