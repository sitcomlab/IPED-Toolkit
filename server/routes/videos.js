module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    var Video = require('../models/Video');

    // 3.2.1 List all Videos (Developer: Nicho)
    app.get('/api/videos', function(req, res) {
        req.log.info('[GET] /api/videos');
        Video.getAll(function(err, videos) {
            if (!err) {
                send.data(res, JSON.stringify(videos));
            } else {
                send.error(res, err);
            }
        });
    });
    
    // 3.2.2 Create a Video (Developer: Nicho)
    app.post('/api/videos', function(req, res) {
        req.log.info('[POST] /api/video');
        Video.create(req.body, function(err, video) {
           if (!err) {
               send.data(res, JSON.stringify(video));
           } else {
               send.error(res, err);  
           };
        });
    });

    // 3.2.3 Retrieve a Video (Developer: Nicho)
    app.get('/api/videos/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/videos/:id');
        Video.get(req.params.id, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.4 Edit a Video (Developer: Nicho)
    app.put('/api/videos/:id', function(req, res) {
        req.log.info('[PUT] /api/videos/:id');
        Video.save(req.params.id, req.body, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);  
            };
        });        
    });

    // 3.2.5 Remove a Video (Developer: Nicho)
    app.delete('/api/videos/:id', function(req, res) {
        req.log.info('[DELETE] /api/video/:id');
        Video.delete(req.params.id, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);
            }
        })
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