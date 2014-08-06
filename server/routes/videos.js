module.exports = function(app, db) {
    var async = require('async');
    var JaySchema = require('jayschema');
    var validator = require('validator');
    var videoSchema = require('../schemas/video');
    
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

                console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(200, {
                    'Content-Type' : 'application/json'
                });
                res.end(JSON.stringify(result.data).replace(/_id/g, 'id'));
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
                jayschema.validate(req.body, videoSchema.postVideo, function(errs) {
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
                    if(req.body.url.match('.mp4') || req.body.url.match('.ogv')) {
                        res.writeHead(400, {
                            'Content-Type' : 'text/plain'
                        });
                        res.end('Error: The value of the property "url" contains a videoformat! Please submit only the filename!');
                        return;
                    } else {
                        if(validator.isURL(req.body.url + '.mp4') || validator.isURL(req.body.url + '.ogv')) {
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
                
                    console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                    res.writeHead(201, {
                        'Content-Type' : 'application/json'
                    });
                    res.end(JSON.stringify(newVideo).replace(/_id/g, 'id'));
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

                        console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(200, {
                            'Content-Type' : 'application/json'
                        });
                        res.end(JSON.stringify(result.data[0]).replace(/_id/g, 'id'));
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
                    jayschema.validate(req.body, videoSchema.putVideo, function(errs) {
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
                        if(req.body.url.match('.mp4') || req.body.url.match('.ogv')) {
                            res.writeHead(400, {
                                'Content-Type' : 'text/plain'
                            });
                            res.end('Error: The value of the property "url" contains a videoformat! Please submit only the filename!');
                            return;
                        } else {
                            if(validator.isURL(req.body.url + '.mp4') || validator.isURL(req.body.url + '.ogv')) {
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

                        console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                        res.writeHead(201, {
                            'Content-Type' : 'application/json'
                        });
                        res.end(JSON.stringify(result.data[0]).replace(/_id/g, 'id'));
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

    // 3.2.6 Retrieve all Videos of a Location (Developer: Nicho)
    app.get ('/api/locations/:id/videos', function(req, res) {

        console.log("+++ [GET] /api/locations/" + req.params.id+ "/videos +++++++++++++++++++++++++++++++++++++");

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

                // Query - Get all Videos of the current Location
                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:wasRecordedAt]-v RETURN DISTINCT v";
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