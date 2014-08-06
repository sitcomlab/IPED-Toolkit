module.exports = function(app, db) {
    var async = require('async');
    
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

            console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end(JSON.stringify(result.data).replace(/_id/g, 'id'));
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
            jayschema.validate(req.body, overlaySchema.postOverlay, function(errs) {
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
                    
                console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                res.writeHead(201, {
                    'Content-Type' : 'application/json'
                });
                res.end(JSON.stringify(newOverlay).replace(/_id/g, 'id'));
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

                    console.log("+++ SUCCESS +++ 200 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

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
                jayschema.validate(req.body, overlaySchema.putOverlay, function(errs) {
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

                    console.log("+++ SUCCESS +++ 201 ++++++++++++++++++++++++++++++++++++++++++++++++++++");

                    res.writeHead(201, {
                        'Content-Type' : 'application/json'
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

// 3.3.6 Retrieve all Overlays of a Location (Developer: Nicho)
app.get ('/api/locations/:id/overlays', function(req, res) {

    console.log("+++ [GET] /api/locations/" + req.params.id+ "/overlays +++++++++++++++++++++++++++++++++++");

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

            // Query - Get all Overlays of the current Location
            var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:locatedAt]-o RETURN DISTINCT o";
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