/*********************************************************************************************
 Node.js Webserver
 *********************************************************************************************
 Table of content

 1. Server-Settings
 2. webRTC
 3. API
     3.1 Locations:
         3.1.1 List all Locations
         3.1.2 Create a Location [+]
         3.1.3 Retrieve a Location
         3.1.4 Remove a Location [+]
     3.2 Videos:
         3.2.1 List all Videos [*]
         3.2.2 Create a Video [*]
         3.2.3 Retrieve a Video [*]
         3.2.4 Remove a Video [*]
     3.3 Overlays
         3.3.1 List all Overlays [*]
         3.3.2 Create an Overlay [*]
         3.3.3 Retrieve an Overlay [*]
         3.3.4 Remove an Overlay [*]
         3.4 Scenarios [!]

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
var stylus = require('stylus');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');

var async = require('async');

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
    key : fs.readFileSync('server.key'),
    cert : fs.readFileSync('server.crt'),
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
io.sockets.on('connection', function(socket) {
    io.sockets.emit('news', {
        Info : 'New Connection'
    });
    socket.on('message', function(data) {
        console.log(data);

    });
    socket.on('remote', function(data) {
        io.sockets.emit('command', data);
        console.log(data);
    });
});

/*********************************************************
 2. webRTC
 *********************************************************/

// create the webRTC switchboard
var switchboard = require('rtc-switchboard')(httpsServer);

// convert stylus stylesheets
app.use(stylus.middleware({
    src : __dirname + '/public',
    compile : function(str, sourcePath) {
        return stylus(str).set('filename', sourcePath).set('compress', false).use(nib());
    }
}));

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function(req, res, next) {
    res.writeHead(200);
    fs.createReadStream(path.resolve(__dirname, 'public', 'webRTC.html')).pipe(res);
});

// serve the rest statically
//app.use(browserify('./public', {debug: false}));
app.get('/js/webRTC.js', function(req, res, next) {
    res.writeHead(200);
    var b = browserify();
    b.add('./public/js/webRTC.js');
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

// 3.1.1 List all Locations (Developer: Nicho)
app.get('/api/locations', function(req, res) {

    // Query
    var query = "MATCH (l:Location) RETURN l";
    console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;
        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var jsonString = JSON.stringify(result.data);

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"locations":' + jsonString + '}');
            return;
        }

    });
});

// 3.1.2 Create a Location (Developer: Nicho)
app.post('/api/locations', function(req, res) {

    var newNodeID;
    var newLocation;

    if (JSON.stringify(req.body) == '{}') {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end("Error: No data submitted!");
        return;
    } else {

        // 1st Database Query: CREATE new Location
        db.insertNode({
            name : req.body.name,
            description : req.body.description,
            tags : req.body.tags,
            lat : req.body.lat,
            lon : req.body.lon
        }, ['Location'], function(err, node) {
            if (err) {
                res.writeHead(400, {
                    'Content-Type' : 'text/plain'
                });
                res.end("Error: data couldn't saved in the database");
                return;
            } else {

                // Output node properties
                console.log("newNodeProperties: " + JSON.stringify(node));
                newLocation = node;

                // Output node id
                console.log("newNodeID: " + node._id);
                newNodeID = node._id;

                // Asynchron functions to set the relationships for the new Location
                async.parallel({
                    relatedLocations : function(callback1) {

                        var locationIDs = new Array();

                        async.forEach(req.body.relatedLocations, function(locationID_temp, callback) {
                            
                            // 2nd Database Query: SET relationships between Locations and the new Location  
                            db.insertRelationship(locationID_temp, newNodeID, 'locatetTo', {}, function(err, relationship) {
                                if (err) {
                                    console.log("Error: Could not find the related Location with the ID" + locationID_temp);

                                    // tell async that the iterator has completed
                                    callback();

                                } else {

                                    // Output relationship properties
                                    //console.log(relationship.data);

                                    // Output relationship id
                                    //console.log(relationship._id);

                                    // Output relationship start_node_id
                                    //console.log(relationship._start_node_id);

                                    // Output relationship end_node_id
                                    //console.log(relationship._end_node_id);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Location " + locationID_temp);
                                    locationIDs.push(locationID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("LocationsArray: " + JSON.stringify(locationIDs));
                            callback1(null, locationIDs);
                        });

                    },
                    videos : function(callback2) {

                        var videoIDs = new Array();

                        async.forEach(req.body.videos, function(videoID_temp, callback) {
                            
                            // 3rd Database Query: SET relationships between Videos and the new Location 
                            db.insertRelationship(videoID_temp, newNodeID, 'wasRecordedAt', {}, function(err, relationship) {
                                if (err) {
                                    console.log("Error: Could not find the related Video with the ID" + videoID_temp);

                                    // tell async that the iterator has completed
                                    callback();

                                } else {

                                    // Output relationship properties
                                    //console.log(relationship.data);

                                    // Output relationship id
                                    //console.log(relationship._id);

                                    // Output relationship start_node_id
                                    //console.log(relationship._start_node_id);

                                    // Output relationship end_node_id
                                    //console.log(relationship._end_node_id);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Video " + videoID_temp);
                                    videoIDs.push(videoID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("VideoArray: " + JSON.stringify(videoIDs));
                            callback2(null, videoIDs);
                        });

                    },
                    overlays : function(callback3) {

                        var overlayIDs = new Array();

                        async.forEach(req.body.overlays, function(overlayID_temp, callback) {
                            
                            // 4th Database Query: SET relationships between Overlays and the new Location 
                            db.insertRelationship(overlayID_temp, newNodeID, 'locatedAt', {}, function(err, relationship) {
                                if (err) {
                                    console.log("Error: Could not find the related Overlay with the ID" + overlayID_temp);

                                    // tell async that the iterator has completed
                                    callback();

                                } else {

                                    // Output relationship properties
                                    //console.log(relationship.data);

                                    // Output relationship id
                                    //console.log(relationship._id);

                                    // Output relationship start_node_id
                                    //console.log(relationship._start_node_id);

                                    // Output relationship end_node_id
                                    //console.log(relationship._end_node_id);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Overlay " + overlayID_temp);
                                    overlayIDs.push(overlayID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("OverlayArray: " + JSON.stringify(overlayIDs));
                            callback3(null, overlayIDs);
                        });

                    },
                }, function(err, results) {
                    //console.log("Results_temp:" + JSON.stringify(results));

                    // Prepare final Result
                    newLocation.relatedLocations = results.relatedLocations;
                    newLocation.videos = results.videos;
                    newLocation.overlays = results.overlays;
                    var finalResult = '{"location": [' + JSON.stringify(newLocation) + '] }';
                    
                    console.log(finalResult);
                    
                    // Send final Result
                    res.writeHead(201, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(finalResult);
                    return;
                });

            }
        });
    }
});

// 3.1.3 GET all information about one location (Developer: Nicho)
app.get('/api/locations/:id', function(req, res) {

    // 1st Query
    var query_1 = "START l=node(" + req.params.id + ") RETURN l";
    console.log(query_1);

    // 1st Database Query
    db.cypherQuery(query_1, function(err, result) {
        if (err) {

            throw err;

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;
        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            // Results
            var location = result.data;

            // 2nd Query
            var query_2 = "START l=node(" + req.params.id + ") MATCH l-[:relatedTo]->n RETURN id(n) AS relatedTo";
            console.log(query_2);

            // 2nd Database Query
            db.cypherQuery(query_2, function(err, result) {
                if (err) {

                    throw err;

                    res.writeHead(500, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end("Error:" + err);
                    return;
                } else {

                    // Results
                    var relations = result.data;

                    // Adding the attribute "relatedLocations" to JSON-Objekt
                    location[0].relatedLocations = relations;

                    // 3rd Query
                    var query_3 = "START l=node(" + req.params.id + ") MATCH l<-[:wasRecordedAt]-v RETURN id(v) AS wasRecordedAt";
                    console.log(query_3);

                    // 3rd Database Query
                    db.cypherQuery(query_3, function(err, result) {
                        if (err) {

                            throw err;

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end("Error:" + err);
                            return;
                        } else {
                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            // Results
                            var videos = result.data;

                            // Adding the attribute "videos" to JSON-Objekt
                            location[0].videos = videos;

                            // 4th Query
                            var query_4 = "START l=node(" + req.params.id + ") MATCH l<-[:locatedAt]-o RETURN id(o) AS locatedAt";
                            console.log(query_4);

                            // 3rd Database Query
                            db.cypherQuery(query_4, function(err, result) {
                                if (err) {

                                    throw err;

                                    res.writeHead(500, {
                                        'Content-Type' : 'text/plain'
                                    });
                                    res.end("Error:" + err);
                                    return;
                                } else {
                                    //console.log(result.data);
                                    // delivers an array of query results
                                    //console.log(result.columns);
                                    // delivers an array of names of objects getting returned

                                    // Results
                                    var overlays = result.data;

                                    // Adding the attribute "videos" to JSON-Objekt
                                    location[0].overlays = overlays;

                                    // Return final Result
                                    var finalResult = '{"location":' + JSON.stringify(location) + '}';
                                    console.log(finalResult);

                                    res.writeHead(200, {
                                        'Content-Type' : 'application/json'
                                    });
                                    res.end(finalResult);
                                    return;
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// 3.1.4 Remove a Location

/****************************
 3.2 Videos
 ****************************/

// 3.2.1 List all Videos

// 3.2.2 Create a Video

// 3.2.3 Retrieve a Video

// 3.2.4 Remove a Video

/****************************
 3.3 Overlays
 ****************************/

// 3.3.1 List all Overlays

// 3.3.2 Create an Overlay

// 3.3.3 Retrieve an Overlay

// 3.3.4 Remove an Overlay

/****************************
 3.4 Scenarios
 ****************************/

// 3.4.1 GET a list of all scenarios (Developer: Nicho)
app.get('/api/scenarios', function(req, res) {

    // Query
    var query = "MATCH (s:Scenario) RETURN s";
    console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;
        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var jsonString = JSON.stringify(result.data);
            console.log(jsonString);

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"scenarios":' + jsonString + '}');
            return;
        }
    });
});

// get Scenrio (Developer: Nicho)
app.get('/api/scenarios/:id', function(req, res) {

    // Query
    var query = "MATCH (l:Location)<-[:contains]-(s:Scenario { name: \"Scenario 1\" }) RETURN {s AS scenario, l AS startLocation} AS scenario";
    console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;

        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var jsonString_1 = JSON.stringify(result.data);
            console.log(jsonString_1);

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"scenario":' + jsonString_1 + '}');
            return;
        }
    });
});

