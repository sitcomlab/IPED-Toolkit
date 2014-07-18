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

// for validation of received data
var validator = require('validator');
var JaySchema = require('jayschema');
var schemas = require('./json-schemas.js');

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

    console.log("--- Validating all properties for Insertion ---");
    
   
    // JSON-Schema-Constructor
    var jayschema = new JaySchema();

    async.series({
        jsonvalidation_1 : function(callback) {

            if (JSON.stringify(req.body) == '{}') {

                res.writeHead(400, {
                    'Content-Type' : 'text/plain'
                });
                res.end('Error: No data submitted!');
                return;
            }
            else {
                callback(null);
            }
        },
        jsonvalidation_2 : function(callback) {
            jayschema.validate(req.body, schemas.getSchema('postLocationSchema'), function(errs) {
                if (errs) {

                    for (var i=0; i < errs.length; i++) {

                        // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                        if(errs[i].constraintName == 'required') {

                            var errorMsg = errs[i].desc.split('missing: ');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                            return;
                        }

                        // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                        if(errs[i].constraintName == 'type') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                            return;
                        }
                        
                        // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                        if(errs[i].constraintName == 'minLength') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                            return;
                        }

                        // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                        if(errs[i].constraintName == 'enum') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                            return;
                        }

                        // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                        if(errs[i].constraintName == 'uniqueItems') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                            return;
                        }

                        // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                        if(errs[i].constraintName == 'additionalProperties') {

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                            return;
                        }
                        
                        // If an unknown error occurred
                        else {
                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                            return;
                        }
                    }
                }
                else {
                    callback(null);
                }
            });
        }
    },
    function(err, results) {
        
        console.log("--- Finished validation of all properties successfully ---");

        console.log("--- Creating new Location ---");

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
    });
});

// 3.1.3 Retrieve a Location with all information (Developer: Nicho)
app.get('/api/locations/:id', function(req, res) {

    console.log("+++ [GET] /api/locations/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Location";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
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

        // JSON-Schema-Constructor
        var jayschema = new JaySchema();

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Location";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            },
            jsonValidation_1 : function(callback) {

                if (JSON.stringify(req.body) == '{}') {

                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: No data submitted!');
                    return;
                }
                else {
                    callback(null);
                }
            },
            jsonvalidation_2 : function(callback) {
                jayschema.validate(req.body, schemas.getSchema('putLocationSchema'), function(errs) {
                    if (errs) {

                        for (var i=0; i < errs.length; i++) {

                            // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                            if(errs[i].constraintName == 'required') {

                                var errorMsg = errs[i].desc.split('missing: ');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                                return;
                            }

                            // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                            if(errs[i].constraintName == 'type') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                                return;
                            }
                            
                            // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                            if(errs[i].constraintName == 'minLength') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                                return;
                            }

                            // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                            if(errs[i].constraintName == 'enum') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                                return;
                            }

                            // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                            if(errs[i].constraintName == 'uniqueItems') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                                return;
                            }

                            // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                            if(errs[i].constraintName == 'additionalProperties') {

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                                return;
                            }
                            
                            // If an unknown error occurred
                            else {
                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                                return;
                            }
                        }
                    }
                    else {
                        callback(null);
                    }
                });
            }
        },
        function(err, results) {
        
            console.log("--- Finished validation of all properties successfully ---");

            console.log("--- Updating properties of the Location ---");

            // For Database Query
            var propertyChanges = '';

            // Preparing Database Query
            if(req.body.name) {
                propertyChanges = propertyChanges + 'SET l.name=' + JSON.stringify(req.body.name) + ' ';
            }
            if(req.body.description || req.body.description == "") {
                propertyChanges = propertyChanges + 'SET l.description=' + JSON.stringify(req.body.description) + ' ';
            }
            if(req.body.tags) {
                propertyChanges = propertyChanges + 'SET l.tags=' + JSON.stringify(req.body.tags) + ' ';
            }
            if(req.body.lat) {
                propertyChanges = propertyChanges + 'SET l.lat=' + req.body.lat + ' ';
            }
            if(req.body.lon) {
                propertyChanges = propertyChanges + 'SET l.lon=' + req.body.lon + ' ';
            }

            console.log("--- Updating properties of the Video ---");


            // 1st Query - Update all properties of the Location
            var query_1 = 'MATCH (l:Location) WHERE ID(l)=' + req.params.id + ' ' + propertyChanges + 'RETURN l';
            console.log(query_1);

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

                            var propertyName = "relatedLocations";
                            var locationIDs = new Array();

                            // Check if property was submitted, if "true", then update all relationships, else get the old IDs
                            if(req.body.relatedLocations) {
                                
                                console.log('--- Updating the relationships for "' + propertyName + '"! ---');
                            
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
                            } else {
                                console.log('Could not found the property "' + propertyName + '"!');
                                
                                // Query - Get all IDs of the related Locations
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l-[:relatedTo]->n RETURN ID(n) AS relatedTo";
                                console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        console.log("Error: Could not found related Locations!");
                                        callback_01(null, locationIDs);

                                    } else {
                                        console.log(result.data);
                                        locationIDs = result.data;
                                        callback_01(null, locationIDs);
                                    }
                                });
                            }
                        },
                        videos : function(callback_02) {
        
                            var propertyName = "videos";
                            var videoIDs = new Array();

                            // Check if property was submitted, if "true", then update all relationships, else get the old IDs
                            if(req.body.videos) {
                                
                                console.log('--- Updating the relationships for "' + propertyName + '"! ---');

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
                            } else {
                                console.log('Could not found the property "' + propertyName + '"!');
                                
                                // Query - Get all IDs of the related Videos
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:wasRecordedAt]-v RETURN ID(v) AS videos";
                                console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        console.log("Error: Could not found related Videos!");
                                        callback_02(null, videoIDs);

                                    } else {
                                        console.log(result.data);
                                        videoIDs = result.data;
                                        callback_02(null, videoIDs);
                                    }
                                });
                            }
                        },
                        overlays : function(callback_03) {
        
                            var propertyName = "overlays";
                            var overlayIDs = new Array();

                            // Check if property was submitted, if "true", then update all relationships, else get the old IDs
                            if(req.body.overlays) {
                                
                                console.log('--- Updating the relationships for "' + propertyName + '"! ---');

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
                            } else {
                                console.log('Could not found the property "' + propertyName + '"!');
                                
                                // Query - Get all IDs of the related Videos
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:locatedAt]-o RETURN ID(o) AS overlays";
                                console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        console.log("Error: Could not found related Overlays!");
                                        callback_03(null, overlayIDs);

                                    } else {
                                        console.log(result.data);
                                        overlayIDs = result.data;
                                        callback_03(null, overlayIDs);
                                    }
                                });
                            }
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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
        res.end(errorMsg);
        return;
    }
});

// 3.1.5 Remove a Location (Developer: Nicho)
app.delete ('/api/locations/:id', function(req, res) {

    console.log("+++ [DELETE] /api/locations/" + req.params.id+ " +++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Location";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
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
    
   
    // JSON-Schema-Constructor
    var jayschema = new JaySchema();

    async.series({
        jsonvalidation_1 : function(callback) {

            if (JSON.stringify(req.body) == '{}') {

                res.writeHead(400, {
                    'Content-Type' : 'text/plain'
                });
                res.end('Error: No data submitted!');
                return;
            }
            else {
                callback(null);
            }
        },
        jsonvalidation_2 : function(callback) {
            jayschema.validate(req.body, schemas.getSchema('postVideoSchema'), function(errs) {
                if (errs) {

                    for (var i=0; i < errs.length; i++) {

                        // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                        if(errs[i].constraintName == 'required') {

                            var errorMsg = errs[i].desc.split('missing: ');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                            return;
                        }

                        // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                        if(errs[i].constraintName == 'type') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                            return;
                        }
                        
                        // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                        if(errs[i].constraintName == 'minLength') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                            return;
                        }

                        // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                        if(errs[i].constraintName == 'enum') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                            return;
                        }

                        // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                        if(errs[i].constraintName == 'uniqueItems') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                            return;
                        }

                        // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                        if(errs[i].constraintName == 'additionalProperties') {

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                            return;
                        }
                        
                        // If an unknown error occurred
                        else {
                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                            return;
                        }
                    }
                }
                else {
                    callback(null);
                }
            });
        },
        jsonvalidation_3 : function(callback) {
            // Check if "url" is a valid URL
            if (req.body.url && !(req.body.url == "")) {
                if(validator.isURL(req.body.url)) { 
                    //console.log("received valid URL!");
                    callback(null);
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The value of the property "url" is not a valid URL!');
                    return;
                }
            }
            else {
                callback(null);
            }
        },
        jsonvalidation_4 : function(callback) {
            // Check if "date" is a valid DATE
            if (req.body.date && !(req.body.date == "")) {
                if(validator.isDate(req.body.date) && (req.body.date.length == 16 || req.body.date.length == 10)) {
                    //console.log("received valid DATE!");
                    callback(null);
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The value of the property "date" is not a valid DATE! ' +
                        'Please submit a date in the form "YYYY-MM-DD" OR "YYYY-MM-DD HH:mm" ' +
                        '(Y=YEAR, M=Month, D=Day, H=Hour, m=Minute), for example: "2014-05-01 08:04")!');
                    return;
                }
            }
            else {
                callback(null);
            }
        }
    },
    function(err, results) {
        
        console.log("--- Finished validation of all properties successfully ---");

        console.log("--- Creating new Video ---");

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
    });
});

// 3.2.3 Retrieve a Video (Developer: Nicho)
app.get('/api/videos/:id', function(req, res) {

    console.log("+++ [GET] /api/videos/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Video";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
        res.end(errorMsg);
        return;
    }
});

// 3.2.4 Edit a Video (Developer: Nicho)
app.put('/api/videos/:id', function(req, res) {

    console.log("+++ [PUT] /api/videos/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++++");

    console.log("--- Validating all properties for Updating ---");


    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // JSON-Schema-Constructor
        var jayschema = new JaySchema();

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Video";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            },
            jsonvalidation_1 : function(callback) {

                if (JSON.stringify(req.body) == '{}') {

                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: No data submitted!');
                    return;
                }
                else {
                    callback(null);
                }
            },
            jsonvalidation_2 : function(callback) {
                jayschema.validate(req.body, schemas.getSchema('putVideoSchema'), function(errs) {
                    if (errs) {

                        for (var i=0; i < errs.length; i++) {

                            // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                            if(errs[i].constraintName == 'required') {

                                var errorMsg = errs[i].desc.split('missing: ');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                                return;
                            }

                            // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                            if(errs[i].constraintName == 'type') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                                return;
                            }
                            
                            // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                            if(errs[i].constraintName == 'minLength') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                                return;
                            }

                            // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                            if(errs[i].constraintName == 'enum') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                                return;
                            }

                            // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                            if(errs[i].constraintName == 'uniqueItems') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                                return;
                            }

                            // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                            if(errs[i].constraintName == 'additionalProperties') {

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                                return;
                            }
                            
                            // If an unknown error occurred
                            else {
                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                                return;
                            }
                        }
                    }
                    else {
                        callback(null);
                    }
                });
            },
            jsonvalidation_3 : function(callback) {
                // Check if "url" is a valid URL
                if (req.body.url && !(req.body.url == "")) {
                    if(validator.isURL(req.body.url)) { 
                        //console.log("received valid URL!");
                        callback(null);
                    } else {
                        res.writeHead(400, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end('Error: The value of the property "url" is not a valid URL!');
                        return;
                    }
                }
                else {
                    callback(null);
                }
            },
            jsonvalidation_4 : function(callback) {
                // Check if "date" is a valid DATE
                if (req.body.date && !(req.body.date == "")) {
                    if(validator.isDate(req.body.date) && (req.body.date.length == 16 || req.body.date.length == 10)) {
                        //console.log("received valid DATE!");
                        callback(null);
                    } else {
                        res.writeHead(400, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end('Error: The value of the property "date" is not a valid DATE! ' +
                            'Please submit a date in the form "YYYY-MM-DD" OR "YYYY-MM-DD HH:mm" ' +
                            '(Y=YEAR, M=Month, D=Day, H=Hour, m=Minute), for example: "2014-05-01 08:04")!');
                        return;
                    }
                }
                else {
                    callback(null);
                }
            }
        },
        function(err, results) {
        
            console.log("--- Finished validation of all properties successfully ---");

            // For Database Query
            var propertyChanges = '';

            // Preparing Database Query
            if(req.body.name) {
                propertyChanges = propertyChanges + 'SET v.name=' + JSON.stringify(req.body.name) + ' ';
            }
            if(req.body.description || req.body.description == "") {
                propertyChanges = propertyChanges + 'SET v.description=' + JSON.stringify(req.body.description) + ' ';
            }
            if(req.body.tags) {
                propertyChanges = propertyChanges + 'SET v.tags=' + JSON.stringify(req.body.tags) + ' ';
            }
            if(req.body.date || req.body.date == "") {
                propertyChanges = propertyChanges + 'SET v.date=' + JSON.stringify(req.body.date) + ' ';
            }
            if(req.body.url) {
                propertyChanges = propertyChanges + 'SET v.url=' + JSON.stringify(req.body.url) + ' ';
            }

            console.log("--- Updating properties of the Video ---");

            // Query - Update all changed properties of the Video
            var query = 'MATCH (v:Video) WHERE ID(v)=' + req.params.id + ' ' + propertyChanges + 'RETURN v';
            console.log(query);

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
        res.end(errorMsg);
        return;
    }
});

// 3.2.5 Remove a Video (Developer: Nicho)
app.delete('/api/videos/:id', function(req, res) {

    console.log("+++ [DELETE] /api/videos/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Video";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Overlay'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to an "Overlay"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
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

    console.log("--- Validating all properties for Insertion ---");
    
   
    // JSON-Schema-Constructor
    var jayschema = new JaySchema();

    async.series({
        jsonvalidation_1 : function(callback) {

            if (JSON.stringify(req.body) == '{}') {

                res.writeHead(400, {
                    'Content-Type' : 'text/plain'
                });
                res.end('Error: No data submitted!');
                return;
            }
            else {
                callback(null);
            }
        },
        jsonvalidation_2 : function(callback) {
            jayschema.validate(req.body, schemas.getSchema('postOverlaySchema'), function(errs) {
                if (errs) {

                    for (var i=0; i < errs.length; i++) {

                        // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                        if(errs[i].constraintName == 'required') {

                            var errorMsg = errs[i].desc.split('missing: ');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                            return;
                        }

                        // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                        if(errs[i].constraintName == 'type') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                            return;
                        }
                        
                        // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                        if(errs[i].constraintName == 'minLength') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                            return;
                        }

                        // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                        if(errs[i].constraintName == 'enum') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                            return;
                        }

                        // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                        if(errs[i].constraintName == 'uniqueItems') {

                            var errorMsg = errs[i].instanceContext.split('#/');

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                            return;
                        }

                        // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                        if(errs[i].constraintName == 'additionalProperties') {

                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                            return;
                        }
                        
                        // If an unknown error occurred
                        else {
                            res.writeHead(500, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                            return;
                        }
                    }
                }
                else {
                    callback(null);
                }
            });
        },
        jsonvalidation_3 : function(callback) {
            if (req.body.url && !(req.body.url == "")) {
                if(validator.isURL(req.body.url)) { 
                    //console.log("received valid URL!");
                    callback(null);
                } else {
                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: The value of the property "url" is not a valid URL!');
                    return;
                }
            }
            else {
                callback(null);
            }
        }
    },
    function(err, results) {
        
        console.log("--- Finished validation of all properties successfully ---");

        console.log("--- Creating new Overlay ---");

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
                res.end("Error: Internal Server Error! Message: Data couldn't saved in the database!");
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
    });
});

// 3.3.3 Retrieve an Overlay (Developer: Nicho)
app.get('/api/overlays/:id', function(req, res) {

    console.log("+++ [GET] /api/overlays/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++");

    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Overlay";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
        res.end(errorMsg);
        return;
    }
});
    

// 3.3.4 Edit an Overlay (Developer: Nicho)
app.put('/api/overlays/:id', function(req, res) {

    console.log("+++ [PUT] /api/overlays/" + req.params.id + " ++++++++++++++++++++++++++++++++++++++++++++");

    console.log("--- Validating all properties for Updating ---");


    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        // JSON-Schema-Constructor
        var jayschema = new JaySchema();

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Overlay";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            },
            jsonvalidation_1 : function(callback) {

                if (JSON.stringify(req.body) == '{}') {

                    res.writeHead(400, {
                        'Content-Type' : 'text/plain'
                    });
                    res.end('Error: No data submitted!');
                    return;
                }
                else {
                    callback(null);
                }
            },
            jsonvalidation_2 : function(callback) {
                jayschema.validate(req.body, schemas.getSchema('putOverlaySchema'), function(errs) {
                    if (errs) {

                        for (var i=0; i < errs.length; i++) {

                            // Check if error occurred by a missing attribute (e.g. name required, but no attribute "name" received)
                            if(errs[i].constraintName == 'required') {

                                var errorMsg = errs[i].desc.split('missing: ');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errorMsg[1] + '" was not found, but has to be defined!');
                                return;
                            }

                            // Check if error occorred by a wrong domain constraint (e.g. Number received, but String required)
                            if(errs[i].constraintName == 'type') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('The value of the property "' + errorMsg[1] + '" has to be a ' + errs[i].constraintValue + '!');
                                return;
                            }
                            
                            // Check if error occurred by a wrong domain constraint (e.g. empty String received "", but String with minLength=1 required)
                            if(errs[i].constraintName == 'minLength') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" can not be emtpy!');
                                return;
                            }

                            // Check if error occurred by a wrong domain constraint (e.g. ['a','b'] allowed, but ['c'] or ['c','d'] received)
                            if(errs[i].constraintName == 'enum') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The value of the property "' + errorMsg[1] + '" is incorrect! Only the values ' + JSON.stringify(errs[i].constraintValue) + ' are allowed!');
                                return;
                            }

                            // Check if error occorred in an array, where a attribute was defined twice (e.g. ['a','a'] received, but only unique items allowed)
                            if(errs[i].constraintName == 'uniqueItems') {

                                var errorMsg = errs[i].instanceContext.split('#/');

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The element values of the array "' + errorMsg[1] + '" are not unique!');
                                return;
                            }

                            // Check if error occorred by an additional properties (e.g. "yyy":"123" received, but "yyy" is not defined in the JSON-Schema)
                            if(errs[i].constraintName == 'additionalProperties') {

                                res.writeHead(400, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: The property "' + errs[i].testedValue + '" is needless and not allowed!');
                                return;
                            }
                            
                            // If an unknown error occurred
                            else {
                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end('Error: Internal Server Error! Message: Unknown Error. Please check your JSON for syntax errors. If there is still a problem, please contact the webmaster!');
                                return;
                            }
                        }
                    }
                    else {
                        callback(null);
                    }
                });
            },
            jsonvalidation_3 : function(callback) {
                if (req.body.url && !(req.body.url == "")) {
                    if(validator.isURL(req.body.url)) { 
                        //console.log("received valid URL!");
                        callback(null);
                    } else {
                        res.writeHead(400, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end('Error: The value of the property "url" is not a valid URL!');
                        return;
                    }
                }
                else {
                    callback(null);
                }
            }
        },
        function(err, results) {

            console.log("--- Finished validation of all properties successfully ---");

            // For Database Query
            var propertyChanges = '';

            // Preparing Database Query
            if(req.body.name) {
                propertyChanges = propertyChanges + 'SET o.name=' + JSON.stringify(req.body.name) + ' ';
            }
            if(req.body.description || req.body.date == "") {
                propertyChanges = propertyChanges + 'SET o.description=' + JSON.stringify(req.body.description) + ' ';
            }
            if(req.body.tags) {
                propertyChanges = propertyChanges + 'SET o.tags=' + JSON.stringify(req.body.tags) + ' ';
            }
            if(req.body.type) {
                propertyChanges = propertyChanges + 'SET o.type=' + JSON.stringify(req.body.type) + ' ';
            }
            if(req.body.url) {
                propertyChanges = propertyChanges + 'SET o.url=' + JSON.stringify(req.body.url) + ' ';
            }
            if(req.body.w) {
                propertyChanges = propertyChanges + 'SET o.w="' + req.body.w + '" ';
            }
            if(req.body.h) {
                propertyChanges = propertyChanges + 'SET o.h="' + req.body.h + '" ';
            }
            if(req.body.x) {
                propertyChanges = propertyChanges + 'SET o.x="' + req.body.x + '" ';
            }
            if(req.body.y) {
                propertyChanges = propertyChanges + 'SET o.y="' + req.body.y + '" ';
            }
            if(req.body.z) {
                propertyChanges = propertyChanges + 'SET o.z="' + req.body.z + '" ';
            }
            if(req.body.rx) {
                propertyChanges = propertyChanges + 'SET o.rx="' + req.body.rx + '" ';
            }
            if(req.body.ry) {
                propertyChanges = propertyChanges + 'SET o.ry="' + req.body.ry + '" ';
            }
            if(req.body.rz) {
                propertyChanges = propertyChanges + 'SET o.rz="' + req.body.rz + '" ';
            }

            console.log("--- Updating properties of the Overlay ---");

            // Query - Update all properties of the Overlay
            var query = 'MATCH (o:Overlay) WHERE ID(o)=' + req.params.id + ' ' + propertyChanges + 'RETURN o';
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
        }); 
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
        res.end(errorMsg);
        return;
    }
});

// 3.3.5 Remove an Overlay (Developer: Nicho)
app.delete('/api/overlays/:id', function(req, res) {

    console.log("+++ [DELETE] /api/overlays/" + req.params.id + " +++++++++++++++++++++++++++++++++++++++++");
    
    // Check if submitted ID is a number
    if(validator.isInt(req.params.id)) {

        async.series({
            idValidation : function(callback) {
                var query = 'MATCH node WHERE ID(node)=' + req.params.id + ' RETURN LABELS(node) AS label';
                //console.log(query);

                var label = "Overlay";

                    db.cypherQuery(query, function(err, result) {
                    if (err) {

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                        res.end(errorMsg);
                        return;

                    } else {
                        if(result.data[0] == undefined) {
                            console.log('No Node with label "' + label +'" found!');

                            res.writeHead(404, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = "Error: The submitted " + label + "-ID could not be found!";
                            res.end(errorMsg);
                            
                            return;
                        } else if(result.data[0] == 'Location'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Location"!';
                            res.end(errorMsg);
                            return;

                        } else if(result.data[0] == 'Video'){
                            console.log('Node with label "' + result.data[0] + '" found!');

                            res.writeHead(406, {
                                'Content-Type' : 'text/plain'
                            });
                            var errorMsg = 'Error: No valid request! The submitted "' + label + '"-ID belongs to a "Video"!';
                            res.end(errorMsg);
                            return;

                        } else {
                            console.log('Node with label "' + result.data[0] + '" found!');
                            callback(null);
                        }
                    }
                });
            }
        },
        function(err, results) {

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
        });
    } else {
        res.writeHead(406, {
            'Content-Type' : 'text/plain'
        });
        var errorMsg = "Error: No valid request! The submitted ID is not an integer!";
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
