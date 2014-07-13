/*********************************************************************************************
 Node.js Webserver
 *********************************************************************************************
 
 Table of content
 ---------------------------------------

 1. Server-Settings
 2. webRTC
 3. API
    3.1 Locations:
         3.1.1 List all Locations
         3.1.2 Create a Location
         3.1.3 Retrieve a Location
         3.1.4 Edit a Location
         3.1.5 Remove a Location
    3.2 Videos:
         3.2.1 List all Videos
         3.2.2 Create a Video
         3.2.3 Retrieve a Video
         3.2.4 Edit a Video
         3.2.4 Remove a Video
    3.3 Overlays
         3.3.1 List all Overlays
         3.3.2 Create an Overlay
         3.3.3 Retrieve an Overlay
         3.3.4 Edit an Overlay
         3.3.5 Remove an Overlay
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
var stylus = require('stylus');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');
var async = require('async');
var validator = require('validator');

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

    console.log("+++ [GET] /api/locations +++++++++++++++++++++++++++++++++++++++++++++++");

    // Query
    var query = "MATCH (l:Location) RETURN l";
    //console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            var errorMsg = "Error: Internal Server Error; Message: " + err;
            res.end(errorMsg);
            return;

        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var finalResult = '{"locations":' + JSON.stringify(result.data) + '}';
            console.log("================================ Result ================================");
            console.log(finalResult);
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(finalResult);
            return;
        }
    });
});

// 3.1.2 Create a Location (Developer: Nicho)
app.post('/api/locations', function(req, res) {

    console.log("+++ [POST] /api/locations ++++++++++++++++++++++++++++++++++++++++++++++");

    var newNodeID;
    var newLocation;

    var status_relatedLocation = true;
    var status_videos = true;
    var status_overlays = true;

    // Check if all attributes were submitted
    if (JSON.stringify(req.body) == '{}') {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: No data submitted!');
        return;
    } else if (req.body.name == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "name"!');
        return;
    } else if (req.body.description == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "description"!');
        return;
    } else if (req.body.tags == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "tags"!');
        return;
    } else if (req.body.lat == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "lat"!');
        return;
    } else if (req.body.lon == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "lon"!');
        return;
    } else if (req.body.relatedLocations == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "relatedLocations"!');
        return;
    } else if (req.body.videos == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "videos"!');
        return;
    } else if (req.body.overlays == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "overlays"!');
        return;
    } else {

        console.log("--- Creating new Location and Inserting properties ---");

        // 1st Database Query - Create new Location
        db.insertNode({
            name : req.body.name,
            description : req.body.description,
            tags : req.body.tags,
            lat : req.body.lat,
            lon : req.body.lon
        }, ['Location'], function(err, node) {
            if (err) {
                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                res.end("Error: Data couldn't saved in the database");
                return;
            } else {

                // Output node properties
                //console.log("newNodeProperties: " + JSON.stringify(node));
                newLocation = node;

                // Output node id
                newNodeID = node._id;
                console.log("--- Finished Creating new Location, new ID = " + newNodeID + " ---");

                // Asynchron functions to set the relationships for the new Location
                async.parallel({
                    relatedLocations : function(callback1) {

                        console.log("--- Inserting the relationships for related Locations ---");
                        var locationIDs = new Array();


                        async.forEach(req.body.relatedLocations, function(locationID_temp, callback) {

                            // 2nd Query - SET relationships between Locations and the new Location
                            var query_2 = "START l1=node(" + newNodeID + "), l2=node(" + locationID_temp + ") CREATE (l1)-[:relatedTo]->(l2) CREATE (l2)-[:relatedTo]->(l1)";
                            //console.log(query_2);

                            // 2nd Database Query
                            db.cypherQuery(query_2, function(err, result) {
                                if (err) {
                                    console.log("Error: Could not find the related Location " + locationID_temp);
                                    status_relatedLocation = false;

                                    // tell async that the iterator has completed
                                    callback();
                                } else {
                                    //console.log(result.data);
                                    //console.log(result.columns);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Location " + locationID_temp);
                                    locationIDs.push(locationID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("relatedLocations: " + JSON.stringify(locationIDs));
                            console.log("--- Finished inserting the relationships for related Locations ---");
                            callback1(null, locationIDs);
                        });

                    },
                    videos : function(callback2) {

                        console.log("--- Inserting the relationships for Videos ---");
                        var videoIDs = new Array();


                        async.forEach(req.body.videos, function(videoID_temp, callback) {

                            // 3rd Query - SET relationships between Videos and the new Location
                            var query_3 = "START n=node(" + newNodeID + "), m=node(" + videoID_temp + ") CREATE (m)-[:wasRecordedAt]->(n)";
                            //console.log(query_3);

                            // 3rd Database Query
                            db.cypherQuery(query_3, function(err, result) {
                                if (err) {
                                    console.log("Error: Could not find the related Video " + videoID_temp);
                                    status_videos = false;

                                    // tell async that the iterator has completed
                                    callback();
                                } else {
                                    //console.log(result.data);
                                    //console.log(result.columns);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Video " + videoID_temp);
                                    videoIDs.push(videoID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("videos: " + JSON.stringify(videoIDs));
                            console.log("--- Finished inserting the relationships for Videos ---");
                            callback2(null, videoIDs);
                        });

                    },
                    overlays : function(callback3) {

                        console.log("--- Inserting the relationships for Overlays ---");
                        var overlayIDs = new Array();


                        async.forEach(req.body.overlays, function(overlayID_temp, callback) {
                            
                            // 4th Query - SET relationships between Overlays and the new Location
                            var query_4 = "START n=node(" + newNodeID + "), m=node(" + overlayID_temp + ") CREATE (m)-[:locatedAt]->(n)";
                            //console.log(query_4);
                            
                            // 4th Database Query
                            db.cypherQuery(query_4, function(err, result) {
                                if (err) {
                                    console.log("Error: Could not find the related Overlay " + overlayID_temp);
                                    status_overlays = false;

                                    // tell async that the iterator has completed
                                    callback();
                                } else {
                                    //console.log(result.data);
                                    //console.log(result.columns);

                                    console.log("set for new Location " + newNodeID + " a new relationship to Overlay " + overlayID_temp);
                                    overlayIDs.push(overlayID_temp);

                                    // tell async that the iterator has completed
                                    callback();
                                }
                            });

                        }, function(err) {
                            console.log("overlays: " + JSON.stringify(overlayIDs));
                            console.log("--- Finished inserting the relationships for Overlays ---");
                            callback3(null, overlayIDs);
                        });
                    },
                }, function(err, results) {
                    //console.log("Results_temp:" + JSON.stringify(results));

                    // Prepare final Result
                    newLocation.relatedLocations = results.relatedLocations;
                    newLocation.videos = results.videos;
                    newLocation.overlays = results.overlays;
                    var finalResult = JSON.stringify(newLocation);


                    // Check status before sending the answer
                    var httpStatus = null;

                    // true true true // could create everything
                    if (status_relatedLocation && status_videos && status_overlays) {
                        httpStatus = 201;
                    }

                    // false true true // could create Location but error occors in relatedLocations
                    else if (!status_relatedLocation && status_videos && status_overlays) {
                        httpStatus = 211;
                    }

                    // true false true // could create Location but error occors in Videos
                    else if (status_relatedLocation && !status_videos && status_overlays) {
                        httpStatus = 212;
                    }

                    // true true false // could create Location but error occors in Overlays
                    else if (status_relatedLocation && status_videos && !status_overlays) {
                        httpStatus = 213;
                    }

                    // false false true // could create Location but error occors in relatedLocations, Videos
                    else if (!status_relatedLocation && !status_videos && status_overlays) {
                        httpStatus = 214;
                    }

                    // false true false // could create Location but error occors in relatedLocations, Overlays
                    else if (!status_relatedLocation && status_videos && !status_overlays) {
                        httpStatus = 215;
                    }

                    // true false false // could create Location but error occors in Videos, Overlays
                    else if (status_relatedLocation && !status_videos && !status_overlays) {
                        httpStatus = 216;
                    }

                    // false false false // could create Location but error occors in relatedLocations, Videos, Overlays
                    else if (!status_relatedLocation && !status_videos && !status_overlays) {
                        httpStatus = 217;
                    } else {
                        httpStatus = 505;
                    }

                    console.log("================================ Result ================================");
                    console.log("Check if error occurred (false=error):");
                    console.log(" - in relatedLocation? " + status_relatedLocation);
                    console.log(" - in videos? " + status_videos);
                    console.log(" - in overlays? " + status_overlays);
                    console.log("=> Corresponding HTTP-Status-Code: " + httpStatus + " (partially created)");
                    console.log("------------------------------------------------------------------------");
                    console.log(finalResult);
                    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        
                    // Send final Result
                    res.writeHead(httpStatus, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(finalResult);
                    return;
                });

            }
        });
    }
});

// 3.1.3 Retrieve a Location with all information (Developer: Nicho)
app.get('/api/locations/:id', function(req, res) {

    console.log("+++ [GET] /api/locations/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // 1st Query
        var query_1 = "MATCH (l:Location) WHERE ID(l)=" + req.params.id + " RETURN l";
        //console.log(query_1);

        // 1st Database Query
        db.cypherQuery(query_1, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                // Results
                var location = result.data[0];

                // 2nd Query
                var query_2 = "START l=node(" + req.params.id + ") MATCH l-[:relatedTo]->n RETURN id(n) AS relatedTo";
                //console.log(query_2);

                // 2nd Database Query
                db.cypherQuery(query_2, function(err, result) {
                    if (err) {

                        res.writeHead(500, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: Internal Server Error; Message: " + err;
                        res.end(errorMsg);
                        return;

                    } else {

                        // Results
                        var relations = result.data;

                        // Adding the attribute "relatedLocations" to JSON-Objekt
                        location.relatedLocations = relations;

                        // 3rd Query
                        var query_3 = "START l=node(" + req.params.id + ") MATCH l<-[:wasRecordedAt]-v RETURN id(v) AS wasRecordedAt";
                        //console.log(query_3);

                        // 3rd Database Query
                        db.cypherQuery(query_3, function(err, result) {
                            if (err) {

                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                var errorMsg = "Error: Internal Server Error; Message: " + err;
                                res.end(errorMsg);
                                return;

                            } else {
                                //console.log(result.data);
                                // delivers an array of query results
                                //console.log(result.columns);
                                // delivers an array of names of objects getting returned

                                // Results
                                var videos = result.data;

                                // Adding the attribute "videos" to JSON-Objekt
                                location.videos = videos;

                                // 4th Query
                                var query_4 = "START l=node(" + req.params.id + ") MATCH l<-[:locatedAt]-o RETURN id(o) AS locatedAt";
                                //console.log(query_4);

                                // 3rd Database Query
                                db.cypherQuery(query_4, function(err, result) {
                                    if (err) {

                                        res.writeHead(500, {
                                            'Content-Type' : 'text/plain'
                                        });
                                        var errorMsg = "Error: Internal Server Error; Message: " + err;
                                        res.end(errorMsg);
                                        return;

                                    } else {
                                        //console.log(result.data);
                                        // delivers an array of query results
                                        //console.log(result.columns);
                                        // delivers an array of names of objects getting returned

                                        // Results
                                        var overlays = result.data;

                                        // Adding the attribute "overlays" to JSON-Objekt
                                        location.overlays = overlays;

                                        // Return final Result
                                        var finalResult = JSON.stringify(location);
                                        console.log("================================ Result ================================");
                                        console.log(finalResult);
                                        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

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
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

// 3.1.4 Edit a Location (Developer: Nicho)
app.put('/api/locations/:id', function(req, res) {

    console.log("+++ [PUT] /api/locations/" + req.params.id+ " ++++++++++++++++++++++++++++++++++++++++++++");

    var status_relatedLocation = true;
    var status_videos = true;
    var status_overlays = true;

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // Check if all attributes were submitted
        if (JSON.stringify(req.body) == '{}') {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: No data submitted!');
            return;
        } else if (req.body.name == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "name"!');
            return;
        } else if (req.body.description == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "description"!');
            return;
        } else if (req.body.tags == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "tags"!');
            return;
        } else if (req.body.lat == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "lat"!');
            return;
        } else if (req.body.lon == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "lon"!');
            return;
        } else if (req.body.relatedLocations == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "relatedLocations"!');
            return;
        } else if (req.body.videos == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "videos"!');
            return;
        } else if (req.body.overlays == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "overlays"!');
            return;
        } else  {

            console.log("--- Updating properties of the Location ---");

            // 1st Query - Update all properties of the Location
            var query_1 = 'MATCH (l:Location) WHERE ID(l)=' + req.params.id + ' '
                + 'SET l.name="' + req.body.name + '" '
                + 'SET l.description="' + req.body.description + '" '
                + 'SET l.tags=' + JSON.stringify(req.body.tags) + ' '
                + 'SET l.lat="' + req.body.lat + '" '
                + 'SET l.lon="' + req.body.lon + '" '
                + 'RETURN l';
            //console.log(query_1);

            // 1st Database Query
            db.cypherQuery(query_1, function(err, result) {
                if (err) {

                    res.writeHead(500, {
                        'Content-Type' : 'text/plain'
                    });
                    var errorMsg = "Error: Internal Server Error; Message: " + err;
                    res.end(errorMsg);
                    return;

                } else {
                    //console.log(result.data);
                    // delivers an array of query results
                    //console.log(result.columns);
                    // delivers an array of names of objects getting returned

                    var updatedLocation = result.data[0];

                    console.log("--- Finished updating properties of the Location ---");

                    // Asynchron functions to set the relationships for the new Location
                    async.parallel({
                        relatedLocations : function(callback_01) {
                            
                            console.log("--- Updating the relationships for relatedLocations ---");
                            var locationIDs = new Array();
                            

                            // 3rd Query - Delete all relationships between the current Location and related Locations (only when relationships alreday exist)
                            var query_2 = "START l=node("+ req.params.id +") MATCH l-[r:relatedTo]-() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";
                            //console.log(query_2);

                            // 3rd Database Query
                            db.cypherQuery(query_2, function(err, result) {
                                if (err) {

                                    console.log("Error: Could not update the related Locations!");
                                    callback_01(null, locationIDs);

                                } else {

                                    async.forEach(req.body.relatedLocations, function(locationID_temp, callback_1) {

                                        // 3rd Query - Check if all submitted related Locations exist
                                        var query_3 = "START l=node("+ locationID_temp +") RETURN l";
                                        //console.log(query_3);
                
                                        // 3rd Database Query
                                        db.cypherQuery(query_3, function(err, result) {
                                            if (err) {
                                                console.log("Error: Could not find the related Location " + locationID_temp);
                                                status_relatedLocation = false;
                                
                                                // tell async that the iterator has completed
                                                callback_1();
                                            } else {
                                                //console.log(result.data);
                                                //console.log(result.columns);
                                                
                                                console.log("Found the Location " + locationID_temp);


                                                // 4th Query - Connect the submitted related Location to the current Location
                                                var query_4 = "START l1=node(" + req.params.id + "), l2=node(" + locationID_temp + ") CREATE (l1)-[:relatedTo]->(l2) CREATE (l2)-[:relatedTo]->(l1)";
                                                //console.log(query_4);

                                                // 3rd Database Query
                                                db.cypherQuery(query_4, function(err, result) {
                                                    if (err) {
                                                        console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Location " + locationID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_1();    
                                                                    
                                                    } else {
                                                        
                                                        console.log("A new relationship was set between the current Location " + req.params.id + " and the Location " + locationID_temp);
                                                                    
                                                        // Save the ID for the final result
                                                        locationIDs.push(locationID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_1();    
                                                    }
                                                });
                                            }
                                        });   
                                    }, function(err) {
                                        console.log("relatedLocations: " + JSON.stringify(locationIDs));
                                        console.log("--- Finished updating the relatedLocations ---");
                                        callback_01(null, locationIDs);
                                    });
                                }
                            });
                        },
                        videos : function(callback_02) {
        
                            console.log("--- Updating the relationships for Videos ---");
                            var videoIDs = new Array();


                            // 2nd Query - Delete all relationships between the current Location and Videos (only when relationships alreday exist)
                            var query_2 = "START l=node("+ req.params.id +") MATCH l<-[r:wasRecordedAt]-() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";
                            //console.log(query_2);

                            // 2nd Database Query
                            db.cypherQuery(query_2, function(err, result) {
                                if (err) {
                                                 
                                    console.log("Error: Could not update the related Video!");
                                    callback_02(null, videoIDs);

                                } else {

                                    async.forEach(req.body.videos, function(videoID_temp, callback_2) {

                                        // 3rd Query - Check if all submitted related Videos exist
                                        var query_3 = "START v=node("+ videoID_temp +") RETURN v";
                                        //console.log(query_3);
                
                                        // 3rd Database Query
                                        db.cypherQuery(query_3, function(err, result) {
                                            if (err) {
                                                console.log("Error: Could not find the related Videos " + videoID_temp);
                                                status_videos = false;
                                
                                                // tell async that the iterator has completed
                                                callback_2();
                                            } else {
                                                //console.log(result.data);
                                                //console.log(result.columns);
                                                
                                                console.log("Found the Video " + videoID_temp);


                                                // 4th Query - Connect the submitted Video to the current Location
                                                var query_4 = "START l=node(" + req.params.id + "), v=node(" + videoID_temp + ") CREATE (v)-[:wasRecordedAt]->(l)";
                                                //console.log(query_4);

                                                // 3rd Database Query
                                                db.cypherQuery(query_4, function(err, result) {
                                                    if (err) {
                                                        console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Video " + videoID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_2();    
                                                                    
                                                    } else {
                                                        
                                                        console.log("A new relationship was set between the current Location " + req.params.id + " and the Video " + videoID_temp);
                                                                    
                                                        // Save the ID for the final result
                                                        videoIDs.push(videoID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_2();    
                                                    }
                                                });
                                            }
                                        });   
                                    }, function(err) {
                                        console.log("videos: " + JSON.stringify(videoIDs));
                                        console.log("--- Finished updating the Videos ---");
                                        callback_02(null, videoIDs);
                                    });
                                }
                            });
                        },
                        overlays : function(callback_03) {
        
                            console.log("--- Updating the relationships for Overlays ---");
                            var overlayIDs = new Array();


                            // 2nd Query - Delete all relationships between the current Location and Overlays (only when relationships alreday exist)
                            var query_2 = "START l=node("+ req.params.id +") MATCH l<-[r:locatedAt]-() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";                        //console.log(query_2);

                            // 2nd Database Query
                            db.cypherQuery(query_2, function(err, result) {
                                if (err) {
                                                 
                                    console.log("Error: Could not update the related Overlay!");
                                    callback_03(null, overlayIDs);

                                } else {

                                    async.forEach(req.body.overlays, function(overlayID_temp, callback_3) {

                                        // 3rd Query - Check if all submitted related Overlays exist
                                        var query_3 = "START o=node("+ overlayID_temp +") RETURN o";
                                        //console.log(query_3);
                
                                        // 3rd Database Query
                                        db.cypherQuery(query_3, function(err, result) {
                                            if (err) {
                                                console.log("Error: Could not find the related Overlay " + overlayID_temp);
                                                status_overlays = false;
                                
                                                // tell async that the iterator has completed
                                                callback_3();
                                            } else {
                                                //console.log(result.data);
                                                //console.log(result.columns);
                                                
                                                console.log("Found the Overlay " + overlayID_temp);


                                                // 4th Query - Connect the submitted Overlay to the current Location
                                                var query_4 = "START l=node(" + req.params.id + "), o=node(" + overlayID_temp + ") CREATE (o)-[:locatedAt]->(l)";
                                                //console.log(query_4);

                                                // 3rd Database Query
                                                db.cypherQuery(query_4, function(err, result) {
                                                    if (err) {
                                                        console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Overlay " + overlayID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_3();    
                                                                    
                                                    } else {
                                                        
                                                        console.log("A new relationship was set between the current Location " + req.params.id + " and the Overlay " + overlayID_temp);
                                                                    
                                                        // Save the ID for the final result
                                                        overlayIDs.push(overlayID_temp);
                                                                    
                                                        // tell async that the iterator has completed
                                                        callback_3();    
                                                    }
                                                });
                                            }
                                        });   
                                    }, function(err) {
                                        console.log("overlays: " + JSON.stringify(overlayIDs));
                                        console.log("--- Finished updating the Overlays ---");
                                        callback_03(null, overlayIDs);
                                    });
                                }
                            });
                        }
                    }, function(err, allResults) {

                            //console.log("Results_temp:" + JSON.stringify(allResults));

                            // Prepare final Result
                            updatedLocation.relatedLocations = allResults.relatedLocations;
                            updatedLocation.videos = allResults.videos;
                            updatedLocation.overlays = allResults.overlays;
                            var finalResult =  JSON.stringify(updatedLocation);


                            // Check status before sending the answer
                            var httpStatus = null;
                                
                            
                            // true true true // could create everything
                            if (status_relatedLocation && status_videos && status_overlays) {
                                httpStatus = 201;
                            }

                            // false true true // could create Location but error occors in relatedLocations
                            else if (!status_relatedLocation && status_videos && status_overlays) {
                                httpStatus = 211;
                            }
            
                            // true false true // could create Location but error occors in Videos
                            else if (status_relatedLocation && !status_videos && status_overlays) {
                                httpStatus = 212;
                            }
            
                            // true true false // could create Location but error occors in Overlays
                            else if (status_relatedLocation && status_videos && !status_overlays) {
                                httpStatus = 213;
                            }
            
                            // false false true // could create Location but error occors in relatedLocations, Videos
                            else if (!status_relatedLocation && !status_videos && status_overlays) {
                                httpStatus = 214;
                            }
            
                            // false true false // could create Location but error occors in relatedLocations, Overlays
                            else if (!status_relatedLocation && status_videos && !status_overlays) {
                                httpStatus = 215;
                            }
            
                            // true false false // could create Location but error occors in Videos, Overlays
                            else if (status_relatedLocation && !status_videos && !status_overlays) {
                                httpStatus = 216;
                            }
            
                            // false false false // could create Location but error occors in relatedLocations, Videos, Overlays
                            else if (!status_relatedLocation && !status_videos && !status_overlays) {
                                httpStatus = 217;
                            } else {
                                httpStatus = 505;
                            }

                            console.log("================================ Result ================================");
                            console.log("Check if error occurred (false=error):");
                            console.log(" - in relatedLocation? " + status_relatedLocation);
                            console.log(" - in videos? " + status_videos);
                            console.log(" - in overlays? " + status_overlays);
                            console.log("=> Corresponding HTTP-Status-Code: " + httpStatus + " (partially created)");
                            console.log("------------------------------------------------------------------------");
                            console.log(finalResult);
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            
                            // Send final Result
                            res.writeHead(httpStatus, {
                                'Content-Type' : 'application/json'
                            });
                            res.end(finalResult);
                            return;
                        } 
                    );
                }
            });
        }
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

// 3.1.5 Remove a Location (Developer: Nicho)
app.delete ('/api/locations/:id', function(req, res) {

    console.log("+++ [DELETE] /api/locations/" + req.params.id+ " +++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // 1st Query - Count the relationships for the Video, before the deletion
        var query_1 = "START l=node(" + req.params.id + ") MATCH l-[r]-(c) RETURN COUNT(r)";
        //console.log(query_1);

        // 1st Database Query
        db.cypherQuery(query_1, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var connectedRelations = result.data;

                console.log("Found " + connectedRelations + " relationships for Location " + req.params.id);

                // Check if the Location have relationships and delete them too, if they exist
                if (connectedRelations[0] > 0) {

                    // 2nd Query
                    var query_2 = "START l=node(" + req.params.id + ") MATCH l-[r]-() DELETE l, r";
                    //console.log(query_2);

                    // 2nd Database Query
                    db.cypherQuery(query_2, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {
                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Location " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }

                    });
                } else {

                    // 3rd Query
                    var query_3 = "START l=node(" + req.params.id + ") DELETE l";
                    //console.log(query_3);

                    // 3rd Database Query
                    db.cypherQuery(query_3, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {

                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Location " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }

                    });
                }
            }
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

/****************************
 3.2 Videos
 ****************************/

// 3.2.1 List all Videos (Developer: Nicho)
app.get('/api/videos', function(req, res) {

    console.log("+++ [GET] /api/videos ++++++++++++++++++++++++++++++++++++++++++++++++++");

    // Query
    var query = "MATCH (v:Video) RETURN v";
    //console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            var errorMsg = "Error: Internal Server Error; Message: " + err;
            res.end(errorMsg);
            return;

        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var finalResult = '{"videos":' + JSON.stringify(result.data) + '}';
            console.log("================================ Result ================================");
            console.log(finalResult);
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(finalResult);
            return;
        }
    });
});

// 3.2.2 Create a Video (Developer: Nicho)
app.post('/api/videos', function(req, res) {

    console.log("+++ [POST] /api/videos +++++++++++++++++++++++++++++++++++++++++++++++++");

    console.log("--- Validating all properties for Insertion ---");

    // Check if all attributes were submitted
    if (JSON.stringify(req.body) == '{}') {

        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: No data submitted!');
        return;

    } else {

        // Check attribute "name"
        if(req.body.name == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "name"!');
            return;
        } else if(req.body.name == "" || req.body.name == null) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
                res.end('Error: The attribute "name" can not be emtpy!');
                return;
        } else if(req.body.name){
            console.log('Deteced valid attribute "name"!');        
        } else {
            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Internal Server Error!');
            return;
        }

        // Check attribute "description"
        if(req.body.description == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "description"!');
            return;
        } else if(req.body.description == "") {
            console.log('Deteced valid, but empty attribute "description"!');
        } else if(req.body.description){
            console.log('Deteced valid attribute "description"!');        
        } else {
            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Internal Server Error!');
            return;
        }

        // Check attribute "tags"
        if(req.body.tags == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "tags"!');
            return;
        } else if(req.body.tags){
            // Check if submitted tags are empty
            for (var i=0; i < req.body.tags.length; i++) {
                if(req.body.tags[i] == "") {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The elements of the attribute "tags" can not be empty like ""! Please define a valid tag-element(s)!');
                    return;
                }
            }
            console.log('Deteced valid attribute "tags"!');        
        } else {
            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Internal Server Error!');
            return;
        }
    
        // Check attribute "url"
        if(req.body.url == undefined) {  
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "url"!');
            return;
        } else if(req.body.url == "") {
            console.log('Deteced valid, but empty attribute "url"!');
        } else if(req.body.url){
            // Check if URL is a valid URL
            if(validator.isURL(req.body.url)) {
                console.log('Deteced valid attribute "url"!');
            } else {
                res.writeHead(400, {
                    'Content-Type' : 'text/plain'
                });
                res.end('Error: The attribute "url" is not a valid URL!');
                return;
            }
        } else {
            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Internal Server Error!');
            return;
        }

        // Check attribute "date"
        if(req.body.date == undefined) {  
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "date"!');
            return;
        } else if(req.body.date == "") {
            console.log('Deteced valid, but empty attribute "date"!');
        } else if(req.body.date){
                // Check if Date is a valid date
                if(validator.isDate(req.body.date) && (req.body.date.length == 16 || req.body.date.length == 10)) {
                    console.log('Deteced valid attribute "date"!');        
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The attribute "date" is not a valid Date! Please submit a date in the form "YYYY-MM-DD" OR "YYYY-MM-DD HH:mm" (Y=YEAR, M=Month, D=Day, H=Hour, m=Minute), for example: "2014-05-01 08:04"). If you don\'t know the date, please submit an empty String: ""');
                    return;
                }
        } else {
            res.writeHead(500, {
            'Content-Type' : 'text/plain'
            });
            res.end('Error: Internal Server Error!');
            return;
        }

        console.log("--- Creating new Video and Inserting properties ---");

        // Database Query - Create new Video
        db.insertNode({
            name : req.body.name,
            description : req.body.description,
            tags : req.body.tags,
            date : req.body.date,
            url : req.body.url
        }, ['Video'], function(err, node) {
            if (err) {
                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                res.end("Error: Data couldn't saved in the database");
                return;
            } else {

                // Output node properties
                //console.log("newNodeProperties: " + JSON.stringify(node));
                var newVideo = node;

                // Output node id
                var newVideoID = node._id;
                console.log("--- Finished Creating new Video, new ID = " + newVideoID + " ---");
                
                // Result
                var finalResult = JSON.stringify(newVideo);
                console.log("================================ Result ================================");
                console.log(finalResult);
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        
                // Send final Result
                res.writeHead(201, {
                    'Content-Type' : 'application/json'
                });
                res.end(finalResult);
                return;
            }    
        });
    }
});

// 3.2.3 Retrieve a Video (Developer: Nicho)
app.get('/api/videos/:id', function(req, res) {

    console.log("+++ [GET] /api/videos/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // Query
        var query = "MATCH (v:Video) WHERE ID(v)=" + req.params.id + " RETURN v";
        //console.log(query);

        // Database Query
        db.cypherQuery(query, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var finalResult = JSON.stringify(result.data[0]);
                console.log("================================ Result ================================");
                console.log(finalResult);
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(200, {
                    'Content-Type' : 'application/json'
                });
                res.end(finalResult);
                return;
            }
        }); 
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

// 3.2.4 Edit a Video (Developer: Nicho)
app.put('/api/videos/:id', function(req, res) {

    console.log("+++ [PUT] /api/videos/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // For Database Query
        var propertyChanges = '';

        if (JSON.stringify(req.body) == '{}' || req.body == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: No data submitted!');
            return;
        } else {

            console.log("--- Updating properties of the Video ---");

            // Check attribute "name"
            if(req.body.name == undefined) {
                console.log('No changes deteced in property "name"');
            } else if(req.body.name == "" || req.body.name == null){
                res.writeHead(400, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: The attribute "name" can not be emtpy!');
                return;
            } else if(req.body.name){
                propertyChanges = propertyChanges + 'SET v.name="' + req.body.name + '" ';
            } else {
                res.writeHead(500, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: Internal Server Error!');
                return;
            }

            // Check attribute "description"
            if(req.body.description == undefined) {  
                console.log('No changes deteced in property "description"');
            } else if(req.body.description){
                propertyChanges = propertyChanges + 'SET v.description="' + req.body.description + '" ';
            } else {
                res.writeHead(500, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: Internal Server Error!');
                return;
            }

            // Check attribute "tags"
            if(req.body.tags == undefined) {  
                console.log('No changes deteced in property "tags"');
            } else if(req.body.tags){
                propertyChanges = propertyChanges + 'SET v.tags=' + JSON.stringify(req.body.tags) + ' ';
            } else {
                res.writeHead(500, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: Internal Server Error!');
                return;
            }

            // Check attribute "url"
            if(req.body.url == undefined) {  
                console.log('No changes deteced in property "url"');
            } else if(req.body.url == "") {
                propertyChanges = propertyChanges + 'SET v.url=""';
            } else if(req.body.url){
                // Check if URL is a valid URL
                if(validator.isURL(req.body.url)) {
                    propertyChanges = propertyChanges + 'SET v.url="' + req.body.url + '" ';
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The attribute "url" is not a valid URL!');
                    return;
                }
            } else {
                res.writeHead(500, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: Internal Server Error!');
                return;
            }

            // Check attribute "date"
            if(req.body.date == undefined) {  
                console.log('No changes deteced in property "date"');
            } else if(req.body.date == ""){             
                propertyChanges = propertyChanges + 'SET v.date=""';
            } else if(req.body.date){
                // Check if Date is a valid date
                if(validator.isDate(req.body.date) && (req.body.date.length == 16 || req.body.date.length == 10)) {
                    propertyChanges = propertyChanges + 'SET v.date="' + req.body.date + '" ';
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The attribute "date" is not a valid Date! Please submit a date in the form "YYYY-MM-DD" OR "YYYY-MM-DD HH:mm" (Y=YEAR, M=Month, D=Day, H=Hour, m=Minute), for example: "2014-05-01 08:04"). If you don\'t know the date, please submit an empty String: ""');
                    return;
                }
            } else {
                res.writeHead(500, {
                'Content-Type' : 'text/plain'
                });
                res.end('Error: Internal Server Error!');
                return;
            }

            // Query - Update all changed properties of the Video
            var query = 'MATCH (v:Video) WHERE ID(v)=' + req.params.id + ' ' + propertyChanges + 'RETURN v';
            //console.log(query);

            // Database Query
            db.cypherQuery(query, function(err, result) {
                if (err) {

                    res.writeHead(500, {
                        'Content-Type' : 'text/plain'
                    });
                    var errorMsg = "Error: Internal Server Error; Message: " + err;
                    res.end(errorMsg);
                    return;

                } else {
                    //console.log(result.data);
                    // delivers an array of query results
                    //console.log(result.columns);
                    // delivers an array of names of objects getting returned

                    console.log("--- Finished updating properties of the Video ---");

                    var finalResult = JSON.stringify(result.data[0]);
                    console.log("================================ Result ================================");
                    console.log(finalResult);
                    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                    res.writeHead(201, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(finalResult);
                    return;
                }
            });
        }
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

// 3.2.5 Remove a Video (Developer: Nicho)
app.delete('/api/videos/:id', function(req, res) {

    console.log("+++ [DELETE] /api/videos/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // 1st Query - Count the relationships for the Video, before the deletion
        var query_1 = "START v=node(" + req.params.id + ") MATCH v-[r]-(c) RETURN COUNT(v)";
        //console.log(query_1);

        // 1st Database Query
        db.cypherQuery(query_1, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var connectedRelations = result.data;

                console.log("Found " + connectedRelations + " relationships for Video " + req.params.id);

                // Check if the Video have relationships and delete them too, if they exist
                if (connectedRelations[0] > 0) {

                    // 2nd Query
                    var query_2 = "START v=node(" + req.params.id + ") MATCH v-[r]-() DELETE v, r";
                    //console.log(query_2);

                    // 2nd Database Query
                    db.cypherQuery(query_2, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {
                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Video " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }

                    });
                } else {

                    // 3rd Query
                    var query_3 = "START v=node(" + req.params.id + ") DELETE v";
                    //console.log(query_3);

                    // 3rd Database Query
                    db.cypherQuery(query_3, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {

                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Video " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }

                    });
                }
            }
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

/****************************
 3.3 Overlays
 ****************************/

// 3.3.1 List all Overlays (Developer: Nicho)
app.get('/api/overlays', function(req, res) {

    console.log("+++ [GET] /api/overlays ++++++++++++++++++++++++++++++++++++++++++++++++");
    
    // Query
    var query = "MATCH (o:Overlay) RETURN o";
    //console.log(query);

    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            var errorMsg = "Error: Internal Server Error; Message: " + err;
            res.end(errorMsg);
            return;

        } else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned

            var finalResult = '{"overlays":' + JSON.stringify(result.data) + '}';
            console.log("================================ Result ================================");
            console.log(finalResult);
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(finalResult);
            return;
        }

    });
});

// 3.3.2 Create an Overlay (Developer: Nicho)
app.post('/api/overlays', function(req, res) {

    console.log("+++ [POST] /api/overlays +++++++++++++++++++++++++++++++++++++++++++++++");

    // Check if all attributes were submitted
    if (JSON.stringify(req.body) == '{}') {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: No data submitted!');
        return;
    } else if (req.body.name == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "name"!');
        return;
    } else if (req.body.description == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "description"!');
        return;
    } else if (req.body.tags == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "tags"!');
        return;
    } else if (req.body.type == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "date"!');
        return;
    } else if (req.body.url == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "url"!');
        return;
    } else if (req.body.w == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "w"!');
        return;
    } else if (req.body.h == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "h"!');
        return;
    } else if (req.body.x == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "x"!');
        return;
    } else if (req.body.y == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "y"!');
        return;
    } else if (req.body.z == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "z"!');
        return;
    }else if (req.body.d == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "d"!');
        return;
    } else if (req.body.rx == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "rx"!');
        return;
    } else if (req.body.ry == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "ry"!');
        return;
    } else if (req.body.rz == undefined) {
        res.writeHead(400, {
            'Content-Type' : 'text/plain'
        });
        res.end('Error: Could not found the attribute "rz"!');
        return;
    } else {

        console.log("--- Creating new Overlay and Inserting properties ---");

        // Database Query - Create new Overlay
        db.insertNode({
            name : req.body.name,
            description : req.body.description,
            tags : req.body.tags,
            type : req.body.type,
            url : req.body.url,
            w : req.body.w,
            h : req.body.h,
            x : req.body.x,
            y : req.body.y,
            z : req.body.z,
            d : req.body.d,
            rx : req.body.rx,
            ry : req.body.ry,
            rz: req.body.rz 

        }, ['Overlay'], function(err, node) {
            if (err) {
                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                res.end("Error: Data couldn't saved in the database");
                return;
            } else {

                // Output node properties
                //console.log("newNodeProperties: " + JSON.stringify(node));
                var newOverlay = node;

                // Output node id
                var newOverlayID = node._id;
                console.log("--- Finished Creating new Overlay, new ID = " + newOverlayID + " ---");
                
                // Result
                var finalResult = JSON.stringify(newOverlay);
                console.log("================================ Result ================================");
                console.log(finalResult);
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        
                // Send final Result
                res.writeHead(201, {
                    'Content-Type' : 'application/json'
                });
                res.end(finalResult);
                return;
            }    
        });
    }
});

// 3.3.3 Retrieve an Overlay (Developer: Nicho)
app.get('/api/overlays/:id', function(req, res) {

    console.log("+++ [GET] /api/overlays/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // Query
        var query = "MATCH (o:Overlay) WHERE ID(o)=" + req.params.id + " RETURN o";
        //console.log(query);

        // Database Query
        db.cypherQuery(query, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var finalResult = JSON.stringify(result.data[0]);
                console.log("================================ Result ================================");
                console.log(finalResult);
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(200, {
                    'Content-Type' : 'application/json'
                });
                res.end(finalResult);
                return;
            }
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});
    

// 3.3.4 Edit an Overlay (Developer: Nicho)
app.put('/api/overlays/:id', function(req, res) {

    console.log("+++ [PUT] /api/overlays/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // Check if all attributes were submitted
        if (JSON.stringify(req.body) == '{}') {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: No data submitted!');
            return;
        } else if (req.body.name == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "name"!');
            return;
        } else if (req.body.description == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "description"!');
            return;
        } else if (req.body.tags == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "tags"!');
            return;
        } else if (req.body.type == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "date"!');
            return;
        } else if (req.body.url == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "url"!');
            return;
        } else if (req.body.w == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "w"!');
            return;
        } else if (req.body.h == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "h"!');
            return;
        } else if (req.body.x == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "x"!');
            return;
        } else if (req.body.y == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "y"!');
            return;
        } else if (req.body.z == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "z"!');
            return;
        } else if (req.body.d == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "d"!');
            return;
        } else if (req.body.rx == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "rx"!');
            return;
        } else if (req.body.ry == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "ry"!');
            return;
        } else if (req.body.rz == undefined) {
            res.writeHead(400, {
                'Content-Type' : 'text/plain'
            });
            res.end('Error: Could not found the attribute "rz"!');
            return;
        } else {

            console.log("--- Updating properties of the Overlay ---");

            // Query - Update all properties of the Overlay
            var query = 'MATCH (o:Overlay) WHERE ID(o)=' + req.params.id + ' '
                + 'SET o.name="' + req.body.name + '" '
                + 'SET o.description="' + req.body.description + '" '
                + 'SET o.tags=' + JSON.stringify(req.body.tags) + ' '
                + 'SET o.type="' + req.body.type + '" '
                + 'SET o.url="' + req.body.url + '" '
                + 'SET o.w="' + req.body.w + '" '
                + 'SET o.h="' + req.body.h + '" '
                + 'SET o.x="' + req.body.x + '" '
                + 'SET o.y="' + req.body.y + '" '
                + 'SET o.z="' + req.body.z + '" '
                + 'SET o.d="' + req.body.d + '" ' 
                + 'SET o.rx="' + req.body.rx + '" '
                + 'SET o.ry="' + req.body.ry + '" '
                + 'SET o.rz="' + req.body.rz + '" '
                + 'RETURN o';
            //console.log(query);

            // Database Query
            db.cypherQuery(query, function(err, result) {
                if (err) {

                    res.writeHead(500, {
                        'Content-Type' : 'text/plain'
                    });
                    var errorMsg = "Error: Internal Server Error; Message: " + err;
                    res.end(errorMsg);
                    return;

                } else {
                    //console.log(result.data);
                    // delivers an array of query results
                    //console.log(result.columns);
                    // delivers an array of names of objects getting returned

                    console.log("--- Finished updating properties of the Overlay ---");

                    var finalResult = '{"overlay": '+ JSON.stringify(result.data) +'}';
                    console.log("================================ Result ================================");
                    console.log(finalResult);
                    console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                    res.writeHead(201, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(finalResult);
                    return;
                }
            });
        }
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

// 3.3.5 Remove an Overlay (Developer: Nicho)
app.delete('/api/overlays/:id', function(req, res) {

    console.log("+++ [DELETE] /api/overlays/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // 1st Query - Count the relationships for the Overlay, before the deletion
        var query_1 = "START o=node(" + req.params.id + ") MATCH o-[r]-(c) RETURN COUNT(o)";
        //console.log(query_1);

        // 1st Database Query
        db.cypherQuery(query_1, function(err, result) {
            if (err) {

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                var errorMsg = "Error: Internal Server Error; Message: " + err;
                res.end(errorMsg);
                return;

            } else {
                //console.log(result.data);
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var connectedRelations = result.data;

                console.log("Found " + connectedRelations + " relationships for Overlay " + req.params.id);

                // Check if the Overlay have relationships and delete them too, if they exist
                if (connectedRelations[0] > 0) {

                    // 2nd Query
                    var query_2 = "START o=node(" + req.params.id + ") MATCH o-[r]-() DELETE o, r";
                    //console.log(query_2);

                    // 2nd Database Query
                    db.cypherQuery(query_2, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {
                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Overlay " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }

                    });
                } else {

                    // 3rd Query
                    var query_3 = "START o=node(" + req.params.id + ") DELETE o";
                    //console.log(query_3);

                    // 3rd Database Query
                    db.cypherQuery(query_3, function(err, result) {
                        if (err) {

                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: Internal Server Error; Message: " + err;
                            res.end(errorMsg);
                            return;

                        } else {

                            //console.log(result.data);
                            // delivers an array of query results
                            //console.log(result.columns);
                            // delivers an array of names of objects getting returned

                            console.log("Overlay " + req.params.id + " has been deleted!");
                            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(204, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end();
                            return;
                        }
                    });
                }
            }
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not a number!";
        res.end(errorMsg);
        return;
    }
});

/****************************
 3.4 Scenarios
 ****************************/

// 3.4.1 GET a list of all scenarios (Developer: Nicho) [!]
app.get('/api/scenarios', function(req, res) {

    console.log("+++ [GET] /api/scenarios +++++++++++++++++++++++++++++++++++++++++++++++");

    // Query
    var query = "MATCH (s:Scenario) RETURN s";
    //console.log(query);

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

            var finalResult = '{"scenarios":' + JSON.stringify(result.data) + '}';
            console.log("================================ Result ================================");
            console.log(finalResult);
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(finalResult);
            return;
        }
    });
});

// 3.4.2 Create a Scenario [!]

// 3.4.3 Retrieve a Scenario (Developer: Nicho) [!]
app.get('/api/scenarios/:id', function(req, res) {

    console.log("+++ [GET] /api/scenarios/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++");

    // Query
    var query = "MATCH (l:Location)<-[:contains]-(s:Scenario { name: \"Scenario 1\" }) RETURN {s AS scenario, l AS startLocation} AS scenario";
    //console.log(query);

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

            var finalResult = '{"scenario":' + JSON.stringify(result.data) + '}';
            console.log("================================ Result ================================");
            console.log(finalResult);
            console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(finalResult);
            return;
        }
    });
});

// 3.4.4 Edit a Scenario [!]

// 3.4.5 Remove a Scenario [!]

