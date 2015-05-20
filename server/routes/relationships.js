module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    //var Location = require('../models/Location');
    var Relationship = require('../models/Relationship');


    // 3.1.1 Create a Relationship between two Locations with information (Developer: Nicho)
    app.post('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({PARAMS: req.params}, '[POST] /api/locations/:id_start/locations/:id_end');
        Relationship.create(req.params.id_start, req.params.id_end, req.body, function(err, relationship) {
           if (!err) {
               send.data(res, JSON.stringify(relationship));
           } else {
               send.error(res, err);
           }
        });
    });

    // 3.1.2 Retrieve a Relationship between two Locations with all information (Developer: Nicho)
    app.get('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/locations/:id_start/locations/:id_end');
        Relationship.get(req.params.id_start, req.params.id_end, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.3 Edit a Relationship between two Locations (Developer: Nicho)
    app.put('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({PARAMS: req.params}, '[PUT] /api/locations/:id_start/locations/:id_end');
        Relationship.save(req.params.id_start, req.params.id_end, req.body, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.1.4 Remove a Relationship between two Locations (Developer: Nicho)
    app.delete('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({PARAMS: req.params}, '[DELETE] /api/locations/:id_start/locations/:id_end');
        Relationship.delete(req.params.id_start, req.params.id_end, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

};
