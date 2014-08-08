module.exports = function(app) {
    var log = require('../global/log');
    var Location = require('../models/Location');
    
    // 3.1.1 List all Locations (Developer: Morin)
    app.get('/api/locations', function(req, res) {
        req.log.info('[GET] /api/locations');
        Location.getAll(function(err, locations) {
            if (!err) {
                sendData(res, JSON.stringify(locations));
            } else {
                sendError(res, err);
            }
        });
    });

    // 3.1.2 Create a Location (Developer: Morin)
    app.post('/api/locations', function(req, res) {
        req.log.info('[POST] /api/locations');
        Location.create(req.body, function(err, location) {
           if (!err) {
               sendData(res, JSON.stringify(location));
           } else {
               sendError(res, err);  
           };
        });
    });

    // 3.1.3 Retrieve a Location with all information (Developer: Morin)
    app.get('/api/locations/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/locations/:id');
        Location.get(req.params.id, function(err, location) {
            if (!err) {
                sendData(res, JSON.stringify(location));
            } else {
                sendError(res, err);
            }
        });
    });

    // 3.1.4 Edit a Location (Developer: Morin)
    app.put('/api/locations/:id', function(req, res) {
        req.log.info('[PUT] /api/locations/:id');
    });

    // 3.1.5 Remove a Location (Developer: Morin)
    app.delete('/api/locations/:id', function(req, res) {
        req.log.info('[DELETE] /api/locations/:id');
    });

    // 3.1.6 Retrieve all related Locations of a Location (Developer: Morin)
    app.get('/api/locations/:id/locations', function(req, res) {
        req.log.info('[GET] /api/locations/:id/locations');
    });
    
    function sendData(res, data) {
        log.info({data: data}, 'Sending data');
        res.writeHead(200, {
            'Content-Type' : 'application/json'
        });
        res.end(data);
    }
    
    function sendError(res, err) {
        log.error({error: err}, '%s', err.toString());
        res.writeHead(500, {
            'Content-Type' : 'text/plain'
        });
        res.end(err.toString());
    }
}