module.exports = function(app, db) {
    var async = require('async');
    var JaySchema = require('jayschema');
    var validator = require('validator');
    var locationSchema = require('../schemas/location');
    
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
                //console.log(JSON.parse(JSON.stringify(result.data).replace(/_id/g, 'id')));
                // delivers an array of query results
                //console.log(result.columns);
                // delivers an array of names of objects getting returned

                var locations = result.data;

                // Check relatedLocations, Videos and Overlays for each Locationobject
                async.forEach(locations, function(location, callback_AFE) {

                    async.parallel({
                        getRelatedLocations : function(callback) {
                        
                            // Query
                            var query = "MATCH (l:Location) WHERE ID(l)="+ location._id +" MATCH l-[:relatedTo]->l2 RETURN DISTINCT ID(l2) AS relatedTo";
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
                                
                                    location.relatedLocations = result.data;
                                    callback(null);
                                }
                            });
                        },
                        getVideos : function(callback) {
                            // Query
                            var query = "MATCH (l:Location) WHERE ID(l)="+ location._id +" MATCH l<-[:wasRecordedAt]-v RETURN DISTINCT ID(v) AS videos";
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
                                    //console.log(JSON.parse(JSON.stringify(result.data).replace(/_id/g, 'id')));
                                    // delivers an array of query results
                                    //console.log(result.columns);
                                    // delivers an array of names of objects getting returned
                                
                                    location.videos = result.data;
                                    callback(null);
                                }
                            });
                        },
                        getOverlays : function(callback) {
                            // Query
                            var query = "MATCH (l:Location) WHERE ID(l)="+ location._id +" MATCH l<-[:locatedAt]-o RETURN DISTINCT ID(o) AS overlays";
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
                                    //console.log(JSON.parse(JSON.stringify(result.data).replace(/_id/g, 'id')));
                                    // delivers an array of query results
                                    //console.log(result.columns);
                                    // delivers an array of names of objects getting returned
                                
                                    location.overlays = result.data;
                                    callback(null);
                                }
                            });
                        }
                    }, function(err, results) {
                        callback_AFE();
                    });
                }, function(err, results) {
                
                    console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                    res.writeHead(200, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(JSON.stringify(locations).replace(/_id/g, 'id'));
                    return;
                });            
            }
        });
    });

    // 3.1.2 Create a Location (Developer: Nicho)
    app.post('/api/locations', function(req, res) {

        console.log("+++ [POST] /api/locations ++++++++++++++++++++++++++++++++++++++++++++++");

        // Global empty errorMessages
        var err_404 = null;
        var err_406 = null;
        var err_500 = null;

        // Global emtpy Location-Object, will be filled
        var newLocation;
        var newNodeID;

        // Global empty Arrays, will be filled
        var validLocationIDs = new Array();
        var validVideoIDs = new Array();
        var validOverlayIDs = new Array();

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
                jayschema.validate(req.body, locationSchema.postLocation, function(errs) {
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
            jsonValidation_3 : function(callback_jV3) {
                async.parallel({ 
                    validateRelatedLocations : function(callbackVRL) {

                        /* -------- Begin of AFE1 -------- */
                        // Check if all values of the property array "relatedLocations" are a Location
                        async.forEach(req.body.relatedLocations, function(ID_temp, callback_AFE1) {

                            var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                            //console.log(query);

                            var label = "location";

                            db.cypherQuery(query, function(err, result) {
                                if (err) {

                                    err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                    callback_AFE1(null);
                            

                                } else {
                                                            
                                    if(result.data[0] == undefined) {
                                        //console.log('No Node with label "' + label +'" found!');

                                        err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                        callback_AFE1(null);
                                                               
                                                                        
                                    } else if(result.data[0] == 'Video') {
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Video"!';
                                        callback_AFE1(null);
                                                            
                                    } else if(result.data[0] == 'Overlay'){
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to an "Overlay"!';
                                        callback_AFE1(null);
                                                                
                                    } else {
                                        console.log('Node with valid label "' + result.data[0] + '" found!');
                                        callback_AFE1(null);
                                        validLocationIDs.push(ID_temp);
                                    }
                                }
                            });
                        },
                        function(err, results) {
                            callbackVRL(null);    
                        });
                        /* -------- End of AFE1 -------- */
                    },
                    validateVideos : function(callbackVV) {
                        /* -------- Begin of AFE1 -------- */
                        // Check if all values of the property array "videos" are a Video
                        async.forEach(req.body.videos, function(ID_temp, callback_AFE1) {

                            var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                            //console.log(query);

                            var label = "videos";

                            db.cypherQuery(query, function(err, result) {
                                if (err) {

                                    err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                    callback_AFE1(null);
                            

                                } else {
                                                            
                                    if(result.data[0] == undefined) {
                                        //console.log('No Node with label "' + label +'" found!');

                                        err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                        callback_AFE1(null);
                                                               
                                                                        
                                    } else if(result.data[0] == 'Location') {
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Location"!';
                                        callback_AFE1(null);
                                                            
                                    } else if(result.data[0] == 'Overlay'){
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to an "Overlay"!';
                                        callback_AFE1(null);
                                                                
                                    } else {
                                        console.log('Node with valid label "' + result.data[0] + '" found!');
                                        callback_AFE1(null);
                                        validVideoIDs.push(ID_temp);
                                    }
                                }
                            });
                        },
                        function(err, results) {
                            callbackVV(null);    
                        });
                        /* -------- End of AFE1 -------- */
                    },
                    validateOverlays : function(callbackVO) {
                        /* -------- Begin of AFE1 -------- */
                        // Check if all values of the property array "overlays" are an Overlay
                        async.forEach(req.body.overlays, function(ID_temp, callback_AFE1) {

                            var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                            //console.log(query);

                            var label = "overlays";

                            db.cypherQuery(query, function(err, result) {
                                if (err) {

                                    err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                    callback_AFE1(null);
                            

                                } else {
                                                            
                                    if(result.data[0] == undefined) {
                                        //console.log('No Node with label "' + label +'" found!');

                                        err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                        callback_AFE1(null);
                                                               
                                                                        
                                    } else if(result.data[0] == 'Video') {
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Video"!';
                                        callback_AFE1(null);
                                                            
                                    } else if(result.data[0] == 'Location'){
                                        //console.log('Node with label "' + result.data[0] + '" found!');

                                        err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Location"!';
                                        callback_AFE1(null);
                                                                
                                    } else {
                                        console.log('Node with valid label "' + result.data[0] + '" found!');
                                        callback_AFE1(null);
                                        validOverlayIDs.push(ID_temp);
                                    }
                                }
                            });
                        },
                        function(err, results) {
                            callbackVO(null);    
                        });
                        /* -------- End of AFE1 -------- */
                    }
                }, function(err, results) {
                    callback_jV3(null);
                });
            }
        },
        function(err, results) {

            // Check error messages before final Result
            if(err_500 != null) {

                console.log("+++ FAILED +++ 500 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(500, {
                    'Content-Type' : 'text/plain'
                });
                res.end(err_500);
                return;
            } else if (err_404 != null) {

                console.log("+++ FAILED +++ 404 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(404, {
                    'Content-Type' : 'text/plain'
                });
                res.end(err_404);
                return;
            } else if (err_406 != null) {

                console.log("+++ FAILED +++ 406 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(406, {
                    'Content-Type' : 'text/plain'
                });
                res.end(err_406);
                return;
            } else {
        
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

                        console.log("+++ FAILED +++ 500 +++++++++++++++++++++++++++++++++++++++++++++++++++++");
                        res.writeHead(500, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end("Error: Internal Sever Error! Message: " + err);
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
                            
                                async.forEach(validLocationIDs, function(ID_temp, callback) {

                                    // Query - SET relationships between Locations and the new Location
                                    // var query = "START l1=node(" + newNodeID + "), l2=node(" + ID_temp + ") CREATE (l1)-[:relatedTo]->(l2) CREATE (l2)-[:relatedTo]->(l1)";
                                    var query = "START l1=node(" + newNodeID + "), l2=node(" + ID_temp + ") CREATE (l1)-[:relatedTo]->(l2)";
                                    //console.log(query);

                                    // Database Query
                                    db.cypherQuery(query, function(err, result) {
                                        if (err) {
                                            console.log("Error: Could not find the related Location " + ID_temp);
                                        
                                            err_500 =  "Error: Internal Sever Error! Message: " + err;
                                            callback();

                                        } else {
                                            //console.log(result.data);
                                            //console.log(result.columns);

                                            console.log("set for new Location " + newNodeID + " a new relationship to Location " + ID_temp);

                                            callback();
                                        }
                                    });

                                }, function(err) {
                                    console.log("--- Finished inserting the relationships for related Locations ---");
                                    callback1(null);
                                });

                            },
                            videos : function(callback2) {

                                console.log("--- Inserting the relationships for Videos ---");
                            
                                async.forEach(validVideoIDs, function(ID_temp, callback) {

                                    // Query - SET relationships between Videos and the new Location
                                    var query = "START n=node(" + newNodeID + "), m=node(" + ID_temp + ") CREATE (m)-[:wasRecordedAt]->(n)";
                                    //console.log(query);

                                    // Database Query
                                    db.cypherQuery(query, function(err, result) {
                                        if (err) {
                                        
                                            err_500 =  "Error: Internal Sever Error! Message: " + err;
                                            callback();

                                        } else {
                                            //console.log(result.data);
                                            //console.log(result.columns);

                                            console.log("set for new Location " + newNodeID + " a new relationship to Video " + ID_temp);
                                        
                                            callback();
                                        }
                                    });

                                }, function(err) {
                                    console.log("--- Finished inserting the relationships for Videos ---");
                                    callback2(null);
                                });

                            },
                            overlays : function(callback3) {

                                console.log("--- Inserting the relationships for Overlays ---");
                            
                                async.forEach(validOverlayIDs, function(ID_temp, callback) {
                                
                                    // 4th Query - SET relationships between Overlays and the new Location
                                    var query_4 = "START n=node(" + newNodeID + "), m=node(" + ID_temp + ") CREATE (m)-[:locatedAt]->(n)";
                                    //console.log(query_4);
                                
                                    // 4th Database Query
                                    db.cypherQuery(query_4, function(err, result) {
                                        if (err) {
                                        
                                            err_500 =  "Error: Internal Sever Error! Message: " + err;
                                            callback();

                                        } else {
                                            //console.log(result.data);
                                            //console.log(result.columns);

                                            console.log("set for new Location " + newNodeID + " a new relationship to Overlay " + ID_temp);
                                
                                            callback();
                                        }
                                    });

                                }, function(err) {
                                    console.log("--- Finished inserting the relationships for Overlays ---");
                                    callback3(null);
                                });
                            },
                        }, function(err, results) {
                        
                            if(err_500 != null) {

                                console.log("+++ FAILED +++ 500 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end(err_500);
                                return;
                            }
                            else {

                                // Prepare final Result
                                newLocation.relatedLocations = validLocationIDs;
                                newLocation.videos = validVideoIDs;
                                newLocation.overlays = validOverlayIDs;
                            
                                console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                                res.writeHead(201, {
                                    'Content-Type' : 'application/json'
                                });
                                res.end(JSON.stringify(newLocation).replace(/_id/g, 'id'));
                                return;
                            }
                        });
                    }
                });
            }
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

                        async.parallel({
                            getRelatedLocations : function(callback) {
                            
                                // Query
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l-[:relatedTo]->l2 RETURN DISTINCT ID(l2) AS relatedTo";
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
                                    
                                        location.relatedLocations = result.data;
                                        callback(null);
                                    }
                                });
                            },
                            getVideos : function(callback) {
                                // Query
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:wasRecordedAt]-v RETURN DISTINCT ID(v) AS videos";
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
                                        //console.log(JSON.parse(JSON.stringify(result.data).replace(/_id/g, 'id')));
                                        // delivers an array of query results
                                        //console.log(result.columns);
                                        // delivers an array of names of objects getting returned
                                    
                                        location.videos = result.data;
                                        callback(null);
                                    }
                                });
                            },
                            getOverlays : function(callback) {
                                // Query
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:locatedAt]-o RETURN DISTINCT ID(o) AS overlays";
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
                                        //console.log(JSON.parse(JSON.stringify(result.data).replace(/_id/g, 'id')));
                                        // delivers an array of query results
                                        //console.log(result.columns);
                                        // delivers an array of names of objects getting returned
                                    
                                        location.overlays = result.data;
                                        callback(null);
                                    }
                                });
                            }
                        }, function(err, results) {
                            console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                            res.writeHead(200, {
                                'Content-Type' : 'application/json'
                            });
                            res.end(JSON.stringify(location).replace(/_id/g, 'id'));
                            return;
                        });
                    }
                });
            });
        } else {
            console.log("+++ FAILED +++ 406 +++++++++++++++++++++++++++++++++++++++++++++++++++++");
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

        // Global empty errorMessages
        var err_404 = null;
        var err_406 = null;
        var err_500 = null;

        // Global emtpy Location-Object, will be filled
        var updatedLocation = null;

        // Global empty Arrays, will be filled
        var relatedLocationIDs = null;
        var videoIDs = null;
        var overlayIDs = null;

        // Check if submitted ID is a number
        if(validator.isInt(req.params.id)) {

            // JSON-Schema-Constructor
            var jayschema = new JaySchema();

            /* -------- Begin of AS1 -------- */
            async.series({

                idValidation : function(callback_AS1) {

                    console.log("--- Validating of the meta properties ---");

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
                                callback_AS1(null);
                            }
                        }
                    });
                },
                jsonValidation_1 : function(callback_AS1) {

                    if (JSON.stringify(req.body) == '{}') {

                        res.writeHead(400, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end('Error: No data submitted!');
                        return;
                    }
                    else {
                        callback_AS1(null);
                    }
                },
                jsonvalidation_2 : function(callback_AS1) {
                    jayschema.validate(req.body, locationSchema.putLocation, function(errs) {
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

                            console.log("--- Finished validation of the meta properties successfully ---");
                        
                            callback_AS1(null);
                        }
                    });
                },
                updateLocations : function(callback_AS1) {    

                    /* -------- Begin of AP1 -------- */
                    async.parallel({

                        updateMetaProperties : function(callback_AP1) {

                            console.log("--- Updating meta properties of the Location ---");

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


                            // Query - Update all properties of the Location
                            var query = 'MATCH (l:Location) WHERE ID(l)=' + req.params.id + ' ' + propertyChanges + 'RETURN l';
                            //console.log(query);

                            // Database Query
                            db.cypherQuery(query, function(err, result) {
                                if (err) {

                                    var err_500 = "Error: Internal Server Error; Message: " + err;
                                    callback_AS1(null);

                                } else {
                                    //console.log(result.data);
                                    // delivers an array of query results
                                    //console.log(result.columns);
                                    // delivers an array of names of objects getting returned

                                    updatedLocation = result.data[0];

                                    console.log("--- Finished updating meta properties of the Location ---");

                                    callback_AP1(null);
                                }
                            });
                        },
                        updateRelationships : function(callback_AP1) {
                            
                            /* -------- Begin of AP2 -------- */
                            async.parallel({

                                updateRelatedLocations : function(callback_AP2) {

                                    console.log('--- Updating the "relatedLocations" of the Location ---');

                                    // Check if property "relatedLocations" was submitted
                                    if(req.body.relatedLocations) {

                                        // valid Location-IDs for later relationship insertion
                                        var validLocationIDs = new Array();

                                        /* -------- Begin of AS2 -------- */
                                        async.series({

                                            idValidationForArray : function(callback_AS2) {

                                                /* -------- Begin of AFE1 -------- */
                                                // Check if all values of the property array "relatedLocations" are a Location
                                                async.forEach(req.body.relatedLocations, function(ID_temp, callback_AFE1) {

                                                    var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                                                    //console.log(query);

                                                    var label = "relatedLocations";

                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {

                                                            callback_AFE1(null);
                                                            err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';

                                                        } else {
                                                        
                                                            if(result.data[0] == undefined) {
                                                                //console.log('No Node with label "' + label +'" found!');

                                                                callback_AFE1(null);
                                                                err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                                                    
                                                            } else if(result.data[0] == 'Video') {
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Video"!';
                            

                                                            } else if(result.data[0] == 'Overlay'){
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to an "Overlay"!';

                                                            } else {
                                                                console.log('Node with valid label "' + result.data[0] + '" found!');
                                                                callback_AFE1(null);
                                                                validLocationIDs.push(ID_temp);
                                                            }
                                                        }
                                                    });
                                                },
                                                function(err, results) {
                                                    callback_AS2(null);    
                                                });
                                                /* -------- End of AFE1 -------- */
                                            },
                                            deleteRelationships : function(callback_AS2) {

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {

                                                    // Query - Delete all relationships between the current Location and related Locations (only when relationships alreday exist)
                                                    var query = "START l=node("+ req.params.id +") MATCH l-[r:relatedTo]->() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";
                                                    //console.log(query);

                                                    // Database Query
                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {
                                                                     
                                                            console.log('Error: Could not delete the "relatedTo"-Relationships, because no realtionship exist!');

                                                            callback_AS2(null);

                                                        } else {

                                                            callback_AS2(null);
                                                        }
                                                    });
                                                }
                                            },
                                            setNewRelationships : function(callback_AS2){

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {

                                                    /* -------- Begin of AFE2 -------- */
                                                    // Set new relationships between current Location and all validLocationIDs
                                                    async.forEach(validLocationIDs, function(ID_temp, callback_AFE2) {

                                                        // Query - Connect the submitted related Location to the current Location
                                                        // Morin
                                                        // var query = "START l1=node(" + req.params.id + "), l2=node(" + ID_temp + ") CREATE (l1)-[:relatedTo]->(l2) CREATE (l2)-[:relatedTo]->(l1)";
                                                        var query = "START l1=node(" + req.params.id + "), l2=node(" + ID_temp + ") CREATE (l1)-[:relatedTo]->(l2)";
                                                        //console.log(query);

                                                        // Database Query
                                                        db.cypherQuery(query, function(err, result) {
                                                            if (err) {

                                                                console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Location " + ID_temp);
                                                                                
                                                                err_500 = "Error: Internal Server Error; Message: " + err;
                                                                callback_AFE2();
                                                                                
                                                            } else {

                                                                console.log("Inserted a relationship between the current Location " + req.params.id + " and the related Location " + ID_temp);
                                                                callback_AFE2();
                                                            }
                                                        });
                                                    },
                                                    function(err, results) {
                                                        callback_AP2(null);    
                                                    });
                                                    /* -------- End of AFE2 -------- */
                                                }
                                            }
                                        },
                                        function(err, results) {
                                            callback_AS2(null);    
                                        });
                                        /* -------- End of AS2 -------- */

                                    } else {
                                        callback_AP2(null);
                                    }
                                },
                                updateVideos : function(callback_AP2) {

                                    console.log('--- Updating the "videos" of the Location ---');

                                    // Check if property "videos" was submitted
                                    if(req.body.videos) {

                                        // valid Video-IDs for later relationship insertion
                                        var validVideoIDs = new Array();

                                        /* -------- Begin of AS2 -------- */
                                        async.series({

                                            idValidationForArray : function(callback_AS2) {

                                                /* -------- Begin of AFE1 -------- */
                                                // Check if all values of the property array "video" are a Video
                                                async.forEach(req.body.videos, function(ID_temp, callback_AFE1) {

                                                    var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                                                    //console.log(query);

                                                    var label = "videos";

                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {

                                                            callback_AFE1(null);
                                                            err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';

                                                        } else {
                                                        
                                                            if(result.data[0] == undefined) {
                                                                //console.log('No Node with label "' + label +'" found!');

                                                                callback_AFE1(null);
                                                                err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                                                    
                                                            } else if(result.data[0] == 'Location') {
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Location"!';
                            

                                                            } else if(result.data[0] == 'Overlay'){
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to an "Overlay"!';

                                                            } else {
                                                                console.log('Node with valid label "' + result.data[0] + '" found!');
                                                                callback_AFE1(null);
                                                                validVideoIDs.push(ID_temp);
                                                            }
                                                        }
                                                    });
                                                },
                                                function(err, results) {
                                                    callback_AS2(null);    
                                                });
                                                /* -------- End of AFE1 -------- */
                                            },
                                            deleteRelationships : function(callback_AS2) {

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {
                                                
                                                    // Query - Delete all relationships between the current Location and related videos (only when relationships alreday exist)
                                                    var query = "START l=node("+ req.params.id +") MATCH l<-[r:wasRecordedAt]-() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";
                                                    //console.log(query);

                                                    // Database Query
                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {
                                                                     
                                                            console.log('Error: Could not delete the "wasRecordedAt"-Relationships, because no realtionship exist!');

                                                            callback_AS2(null);

                                                        } else {

                                                            callback_AS2(null);
                                                        }
                                                    });
                                                }
                                            },
                                            setNewRelationships : function(callback_AS2){

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {
                                                
                                                    /* -------- Begin of AFE2 -------- */
                                                    // Set new relationships between current Location and all validVideoIDs
                                                    async.forEach(validVideoIDs, function(ID_temp, callback_AFE2) {

                                                        // Query - Connect the submitted related Video to the current Location
                                                        var query = "START l=node(" + req.params.id + "), v=node(" + ID_temp + ") CREATE (v)-[:wasRecordedAt]->(l)";
                                                        //console.log(query);

                                                        // Database Query
                                                        db.cypherQuery(query, function(err, result) {
                                                            if (err) {

                                                                console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Video " + ID_temp);
                                                                                
                                                                err_500 = "Error: Internal Server Error; Message: " + err;
                                                                callback_AFE2();
                                                                                
                                                            } else {

                                                                console.log("Inserted a relationship between the current Location " + req.params.id + " and the related Video " + ID_temp);
                                                                callback_AFE2();
                                                            }
                                                        });
                                                    },
                                                    function(err, results) {
                                                        callback_AP2(null);    
                                                    });
                                                    /* -------- End of AFE2 -------- */
                                                }
                                            }
                                        },
                                        function(err, results) {
                                            callback_AS2(null);    
                                        });
                                        /* -------- End of AS2 -------- */

                                    } else {
                                        callback_AP2(null);
                                    }

                                },
                                updateOverlays : function(callback_AP2) {

                                    console.log('--- Updating the "overlays" of the Location ---');

                                    // Check if property "videos" was submitted
                                    if(req.body.overlays) {

                                        // valid Overlay IDs for later relationship insertion
                                        var validOverlayIDs = new Array();

                                        /* -------- Begin of AS2 -------- */
                                        async.series({

                                            idValidationForArray : function(callback_AS2) {

                                                /* -------- Begin of AFE1 -------- */
                                                // Check if all values of the property array "overlays" are an Overlay
                                                async.forEach(req.body.overlays, function(ID_temp, callback_AFE1) {

                                                    var query = 'MATCH node WHERE ID(node)=' + ID_temp + ' RETURN LABELS(node) AS label';
                                                    //console.log(query);

                                                    var label = "overlays";

                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {

                                                            callback_AFE1(null);
                                                            err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';

                                                        } else {
                                                        
                                                            if(result.data[0] == undefined) {
                                                                //console.log('No Node with label "' + label +'" found!');

                                                                callback_AFE1(null);
                                                                err_404 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array could not be found!';
                                                                    
                                                            } else if(result.data[0] == 'Video') {
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 = 'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Video"!';
                            

                                                            } else if(result.data[0] == 'Location'){
                                                                //console.log('Node with label "' + result.data[0] + '" found!');

                                                                callback_AFE1(null);
                                                                err_406 =  'Error: The ID ' + ID_temp + ' in the "' + label + '"-Array belongs to a "Location"!';

                                                            } else {
                                                                console.log('Node with valid label "' + result.data[0] + '" found!');
                                                                callback_AFE1(null);
                                                                validOverlayIDs.push(ID_temp);
                                                            }
                                                        }
                                                    });
                                                },
                                                function(err, results) {
                                                    callback_AS2(null);    
                                                });
                                                /* -------- End of AFE1 -------- */
                                            },
                                            deleteRelationships : function(callback_AS2) {

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {
                                                    // Query - Delete all relationships between the current Location and related overlays (only when relationships alreday exist)
                                                    var query = "START l=node("+ req.params.id +") MATCH l<-[r:locatedAt]-() WITH r, COUNT(r) AS sum WHERE sum>0 DELETE r";
                                                    //console.log(query);

                                                    // Database Query
                                                    db.cypherQuery(query, function(err, result) {
                                                        if (err) {
                                                                     
                                                            console.log('Error: Could not delete the "locatedAt"-Relationships, because no realtionship exist!');

                                                            callback_AS2(null);

                                                        } else {

                                                            callback_AS2(null);
                                                        }
                                                    });
                                                }
                                            },
                                            setNewRelationships : function(callback_AS2){

                                                // Check error messages before deleting relationships
                                                if(err_500 != null) {
                                                    callback_AP2(null);
                                                } else if (err_404 != null) {
                                                    callback_AP2(null);
                                                } else if (err_406 != null) {
                                                    callback_AP2(null);
                                                } else {

                                                    /* -------- Begin of AFE2 -------- */
                                                    // Set new relationships between current Location and all validOverlayIDs
                                                    async.forEach(validOverlayIDs, function(ID_temp, callback_AFE2) {

                                                        // Query - Connect the submitted Overlay to the current Location
                                                        var query = "START l=node(" + req.params.id + "), o=node(" + ID_temp + ") CREATE (o)-[:locatedAt]->(l)";
                                                        //console.log(query);

                                                        // Database Query
                                                        db.cypherQuery(query, function(err, result) {
                                                            if (err) {

                                                                console.log("Error: Could not insert the relationship between the current Location " + req.params.id + " and the related Overlay " + ID_temp);
                                                                                
                                                                err_500 = "Error: Internal Server Error; Message: " + err;
                                                                callback_AFE2();
                                                                                
                                                            } else {

                                                                console.log("Inserted a relationship between the current Location " + req.params.id + " and the related Overlay " + ID_temp);
                                                                callback_AFE2();
                                                            }
                                                        });
                                                    },
                                                    function(err, results) {
                                                        callback_AP2(null);    
                                                    });
                                                    /* -------- End of AFE2 -------- */
                                                }
                                            }
                                        },
                                        function(err, results) {
                                            callback_AS2(null);    
                                        });
                                        /* -------- End of AS2 -------- */

                                    } else {
                                        callback_AP2(null);
                                    }
                                }
                            },
                            function(err, results) {

                                console.log("--- Finished updating relationships of the Location ---");
                                callback_AP1(null);

                            });
                            /* -------- End of AP2 -------- */
                        }
                    },
                    function(err, results) {

                        callback_AS1(null);

                    });
                    /* -------- End of AP1 -------- */
                },
                loadAndAddAllArrays : function(callback_AS1) {

                    // Check error messages before final Result
                    if(err_500 != null) {

                        console.log("+++ FAILED +++ 500 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(500, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end(err_500);
                        return;
                    } else if (err_404 != null) {

                        console.log("+++ FAILED +++ 404 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(404, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end(err_404);
                        return;
                    } else if (err_406 != null) {

                        console.log("+++ FAILED +++ 406 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(406, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end(err_406);
                        return;
                    } else {
                        console.log("--- Get all new relationships of the Location for the result ---");
                
                        /* -------- Begin of AP3 -------- */
                        async.parallel({
                        
                            loadLocations : function(callback_AP3) {
                            
                                // Query - Get all IDs of the "relatedLocations" of the current Location
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l-[:relatedTo]->n RETURN DISTINCT ID(n) AS relatedTo";
                                //console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        err_500 = "Error: Internal Server Error; Message: " + err;
                                        callback_AP3(null);
                                        
                                    } else {

                                        console.log("relatedLocations: " + JSON.stringify(result.data));
                                        relatedLocationIDs = result.data;
                                        callback_AP3(null);

                                    }
                                });
                            },
                            loadVideos : function(callback_AP3) {

                                // Query - Get all IDs of the "videos" of the current Location
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:wasRecordedAt]-v RETURN DISTINCT ID(v) AS videos";
                                //console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        err_500 = "Error: Internal Server Error; Message: " + err;
                                        callback_AP3(null);
                                        
                                    } else {

                                        console.log("videos: " + JSON.stringify(result.data));
                                        videoIDs = result.data;
                                        callback_AP3(null);

                                    }
                                });

                            },
                            loadOverlays : function(callback_AP3) {

                                // Query - Get all IDs of the "overlays" of the current Location
                                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:locatedAt]-o RETURN DISTINCT ID(o) AS overlays";
                                //console.log(query);

                                // Database Query
                                db.cypherQuery(query, function(err, result) {
                                    if (err) {

                                        err_500 = "Error: Internal Server Error; Message: " + err;
                                        callback_AP3(null);
                                        
                                    } else {

                                        console.log("overlays: " + JSON.stringify(result.data));
                                        overlayIDs = result.data;
                                        callback_AP3(null);

                                    }
                                });

                            }
                        },
                        function(err, results) {

                            // Check error messages before final Result
                            if(err_500 != null) {

                                console.log("+++ FAILED +++ 500 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                                res.writeHead(500, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end(err_500);
                                return;
                            } else if (err_404 != null) {

                                console.log("+++ FAILED +++ 404 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                                res.writeHead(404, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end(err_404);
                                return;
                            } else if (err_406 != null) {

                                console.log("+++ FAILED +++ 406 +++++++++++++++++++++++++++++++++++++++++++++++++++++");

                                res.writeHead(406, {
                                    'Content-Type' : 'text/plain'
                                });
                                res.end(err_406);
                                return;
                            } else {

                                console.log("--- Preparing the final result ---");

                                // Prepare final Result
                                updatedLocation.relatedLocations = relatedLocationIDs;
                                updatedLocation.videos = videoIDs;
                                updatedLocation.overlays = overlayIDs;
                                callback_AS1(null);
                            }
                        });
                        /* -------- End of AP3 -------- */
                    }
                }
            },
            function(err, results) {

                console.log("--- Sending the final result ---");

                console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");
                // Send final Result
                res.writeHead(201, {
                    'Content-Type' : 'application/json'
                });
                res.end(JSON.stringify(updatedLocation).replace(/_id/g, 'id'));
                return;
            });
            /* -------- End of AS1 -------- */
        } else {

            console.log("+++ FAILED +++ 406 +++++++++++++++++++++++++++++++++++++++++++++++++++++");
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
                                    console.log("+++ SUCCESS +++ 204 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

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
                                    console.log("+++ SUCCESS +++ 204 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

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

    // 3.1.6 Retrieve all related Locations of a Location (Developer: Nicho)
    app.get ('/api/locations/:id/locations', function(req, res) {

        console.log("+++ [GET] /api/locations/" + req.params.id+ "/locations ++++++++++++++++++++++++++++++++++");

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

                // Query - Get all related Locations of the current Location
                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l-[:relatedTo]->l2 RETURN DISTINCT l2";
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

                        console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(200, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end(JSON.stringify(result.data).replace(/_id/g, 'id'));
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
}