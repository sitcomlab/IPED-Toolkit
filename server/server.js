/*!
* The iPED Toolkit
* Node.js Webserver
*
* (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*/

/*********************************************************************************************
 Table of content
 *********************************************************************************************
 1. Server-Settings
 2. webRTC
 3. API
    3.1 Locations:
         3.1.1 List all Locations
         3.1.2 Create a Location
         3.1.3 Retrieve a Location
         3.1.4 Edit a Location
         3.1.5 Remove a Location
         3.1.6 Retrieve all related Locations of a Location
    3.2 Videos:
         3.2.1 List all Videos
         3.2.2 Create a Video
         3.2.3 Retrieve a Video
         3.2.4 Edit a Video
         3.2.5 Remove a Video
         3.2.6 Retrieve all Videos of a Location 
    3.3 Overlays
         3.3.1 List all Overlays
         3.3.2 Create an Overlay
         3.3.3 Retrieve an Overlay
         3.3.4 Edit an Overlay
         3.3.5 Remove an Overlay
         3.3.6 Retrieve all Overlays of a Location 
    3.4 Scenarios [!]
         3.4.1 List all Scenarios [!]
         3.4.2 Create a Scenario [!]
         3.4.3 Retrieve a Scenario [!]
         3.4.4 Edit a Scenario [!]
         3.4.5 Remove a Scenario [!]

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

var neo4j = require('node-neo4j');
var express = require('express');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');
var async = require('async');

// Data-Validation
var validator = require('validator');
var JaySchema = require('jayschema');
// Schemas for Data-Validation
var locationSchema = require('./schemas/location');
var videoSchema = require('./schemas/video');
var overlaySchema = require('./schemas/overlay');


/*********************************************************
 1. Server-Settings
 *********************************************************/
var HTTP_PORT = 8080;
var HTTPS_PORT = 8443;
var NEO4J_PORT = 7474;

// Pass console parameters (e.g., server port passed by Jenkins)
process.argv.forEach(function(val, index, array) {
    if (val.indexOf('http=') != -1) {
        HTTP_PORT = val.split('=')[1];
    }
    if (val.indexOf('https=') != -1) {
        HTTPS_PORT = val.split('=')[1];
    }
    if (val.indexOf('neo4j=') != -1) {
        NEO4J_PORT = val.split('=')[1];
    }
});

// Connection to the Neo4j-Database
var db = new neo4j('http://giv-sitcomlab.uni-muenster.de:' + NEO4J_PORT);
console.log('Neo4J-Database-Server started at PORT: ' + NEO4J_PORT);

// Loading package "Express" for creating a webserver
// Morin: webRTC's screen sharing requires a SSL connection
// Morin: The default password for the server.key file is: morin
var options = {
    key : fs.readFileSync('./config/server.key'),
    cert : fs.readFileSync('./config/server.crt'),
    passphrase : 'morin'
};

var app = express();

// Loading package "body-parser" for making POST and PUT requests
app.use(bodyParser());

var httpsServer = require('https').Server(options, app);
httpsServer.listen(HTTPS_PORT, function(err) {
    if (err) {
        return console.log('Encountered error starting server: ', err);
    } else {
        console.log('HTTPS-Server started, listen to PORT: ' + HTTPS_PORT);
    }
});
var httpServer = require('http').Server(app);
httpServer.listen(HTTP_PORT, function(err) {
    if (err) {
        return console.log('Encountered error starting server: ', err);
    } else {
        console.log('HTTP-Server started, listen to PORT: ' + HTTP_PORT);
    }
});

// Public-folder to upload media, like videos
app.set("view options", {
    layout : false
});

// Socket.io packages
var io = socketio.listen(httpServer);
io.on('connection', function(socket) {
    console.log('socket.io[connection]: New connection');
    socket.on('setLocationId', function(data) {
        console.log('socket.io[setLocationId]: ' + JSON.stringify(data));
        io.emit('setLocationId', data); 
    });
});

var ios = socketio.listen(httpsServer);
ios.on('connection', function(socket) {
    console.log('socket.io[connection]: New connection');
    socket.on('setLocationId', function(data) {
        console.log('socket.io[setLocationId]: ' + JSON.stringify(data));
        ios.emit('setLocationId', data); 
    });
});


/*********************************************************
 2. webRTC
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

// Serve static content
app.use(express.static(__dirname + '/public'));
//console.log("App listens on " + os.hostname() + ":{" + httpServer.address().port + "|" + httpsServer.address().port + "}");


/*********************************************************
 3. API
 *********************************************************/

/****************************
 3.1 Locations
 ****************************/
var locations = require('./routes/locations')(app, db);

/****************************
 3.2 Videos
 ****************************/
var videos = require('./routes/videos')(app, db);

/****************************
 3.3 Overlays
 ****************************/
var overlays = require('./routes/overlays')(app, db);
