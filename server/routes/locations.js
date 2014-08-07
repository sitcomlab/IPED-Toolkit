module.exports = function(app) {
    var async = require('async');
    var JaySchema = require('jayschema');
    var validator = require('validator');
    
    var log = require('../global/log');
    var locationSchema = require('../schemas/location');
    var Location = require('../models/Location');
    
    // 3.1.1 List all Locations (Developer: Morin)
    app.get('/api/locations', function(req, res) {
        req.log.debug('[GET] /api/locations');
        Location.getAll(function(err, locations) {
            res.end(JSON.stringify(locations));
        });
    });

    // 3.1.2 Create a Location (Developer: Morin)
    app.post('/api/locations', function(req, res) {
        req.log.debug('[POST] /api/locations');
    });

    // 3.1.3 Retrieve a Location with all information (Developer: Morin)
    app.get('/api/locations/:id', function(req, res) {
        req.log.debug('[GET] /api/locations/:id');
    });

    // 3.1.4 Edit a Location (Developer: Morin)
    app.put('/api/locations/:id', function(req, res) {
        req.log.debug('[PUT] /api/locations/:id');
    });

    // 3.1.5 Remove a Location (Developer: Morin)
    app.delete('/api/locations/:id', function(req, res) {
        req.log.debug('[DELETE] /api/locations/:id');
    });

    // 3.1.6 Retrieve all related Locations of a Location (Developer: Morin)
    app.get('/api/locations/:id/locations', function(req, res) {
        req.log.debug('[GET] /api/locations/:id/locations');
    });
}