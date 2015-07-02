module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    var Location = require('../models/Location');

    // 3.1.1 List all Locations (Developer: Morin)
    app.get('/api/locations', function(req, res) {
        req.log.info('[GET] /api/locations');
        Location.getAll(function(err, locations) {
            if (!err) {
                send.data(res, JSON.stringify(locations));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.2 Create a Location (Developer: Morin)
    app.post('/api/locations', function(req, res) {
        req.log.info('[POST] /api/locations');
        Location.create(req.body, function(err, location) {
           if (!err) {
               send.data(res, JSON.stringify(location));
           } else {
               send.error(res, err);
           }
        });
    });

    // 3.1.3 Retrieve a Location with all information (Developer: Morin)
    app.get('/api/locations/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/locations/:id');
        Location.get(req.params.id, function(err, location) {
            if (!err) {
                send.data(res, JSON.stringify(location));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.4 Edit a Location (Developer: Morin)
    app.put('/api/locations/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[PUT] /api/locations/:id');
        Location.save(req.params.id, req.body, function(err, location) {
            if (!err) {
                send.data(res, JSON.stringify(location));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.5 Remove a Location (Developer: Morin)
    app.delete('/api/locations/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[DELETE] /api/locations/:id');
        Location.delete(req.params.id, function(err, location) {
            if (!err) {
                send.data(res, JSON.stringify(location));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.6 Retrieve all related Locations of a Location (Developer: Morin)
    app.get('/api/locations/:id/locations', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/locations/:id/locations');
        Location.get(req.params.id, function(err, location) {
            if (!err) {
                var relatedLocations = [];
                if (location.relatedLocations.length === 0) {
                    send.data(res, JSON.stringify(relatedLocations));
                } else {
                    location.relatedLocations.forEach(function(relatedLocationId) {
                        Location.get(relatedLocationId, function(err, relatedLocation) {
                            if (!err) {
                                relatedLocations.push(relatedLocation);
                                if (relatedLocations.length == location.relatedLocations.length) {
                                    send.data(res, JSON.stringify(relatedLocations));
                                }
                            }
                        });
                    });
                }
            } else {
                send.error(res, err);
            }
        });
    });

};
