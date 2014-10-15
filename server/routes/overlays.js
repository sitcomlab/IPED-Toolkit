module.exports = function(app) {
	var log = require('../global/log');
    var send = require('../global/send');
    var Overlay = require('../models/Overlay');
    /*var async = require('async');
    var JaySchema = require('jayschema');
    var validator = require('validator');
    var overlaySchema = require('../schemas/overlay');
    */
// 3.3.1 List all Overlays (Developer: Nicho)
app.get('/api/overlays', function(req, res) {
req.log.info('[GET] /api/overlays');
        Overlay.getAll(function(err, overlays) {
            if (!err) {
                send.data(res, JSON.stringify(overlays));
            } else {
                send.error(res, err);
            }
        });
});

// 3.3.2 Create an Overlay (Developer: Nicho)
app.post('/api/overlays', function(req, res) {
	req.log.info('[POST] /api/overlays');
        Overlay.create(req.body, function(err, overlay) {
           if (!err) {
               send.data(res, JSON.stringify(overlay));
           } else {
               send.error(res, err);  
           };
        });
});

// 3.3.3 Retrieve an Overlay (Developer: Nicho)
app.get('/api/overlays/:id', function(req, res) {
	req.log.info({PARAMS: req.params}, '[GET] /api/overlay/:id');
        Overlay.get(req.params.id, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
});

// 3.3.4 Edit an Overlay (Developer: Nicho)
app.put('/api/overlays/:id', function(req, res) {
	req.log.info('[PUT] /api/overlays/:id');
        Overlay.save(req.params.id, req.body, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);  
            };
        });
});

// 3.3.5 Remove an Overlay (Developer: Nicho)
app.delete('/api/overlays/:id', function(req, res) {
	req.log.info('[DELETE] /api/overlays/:id');
        Overlay.delete(req.params.id, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        })
});

// 3.3.6 Retrieve all Overlays of a Location (Developer: Nicho)
app.get ('/api/locations/:id/overlays', function(req, res) {/*
	req.log.info('[GET] /api/locations/:id/overlays');
        Location.get(req.params.id, function(err, location) {
            if (!err) {
                var overlays = [];
                if (location.overlays.length == 0) {
                    send.data(res, JSON.stringify(overlays));
                } else {
                    location.overlays.forEach(function(overlayId) {
                        Location.get(overlayId, function(err, overlay) {
                            if (!err) {
                                overlays.push(overlay);
                                if (overlays.length == location.overlays.length) {
                                    send.data(res, JSON.stringify(overlays));
                                }
                            }
                        })
                    });   
                }
            } else {
                send.error(res, err);
            }
        });
*/
console.log("+++ [GET] /api/locations/" + req.params.id+ "/overlays +++++++++++++++++++++++++++++++++++++");

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
                var query = "MATCH (l:Location) WHERE ID(l)="+ req.params.id +" MATCH l<-[:locatedAt]-v RETURN DISTINCT v";
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