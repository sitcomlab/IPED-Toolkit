module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    var Relationship = require('../models/Relationship');


    // 3.2.1 Retrieve a Relationship by its Id (Developer: Nicho)
    app.get('/api/relationships/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[GET] /api/relationships/:id');
        Relationship.getById(req.params.id, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.2 Edit a Relationship by its Id (Developer: Nicho)
    app.put('/api/relationships/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[PUT] /api/relationships/:id');
        Relationship.saveById(req.params.id, req.body, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.3 Create a Relationship between two Locations with information (Developer: Nicho)
    app.post('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[POST] /api/locations/:id_start/locations/:id_end');
        Relationship.create(req.params.id_start, req.params.id_end, req.body, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.4 Retrieve a Relationship between two Locations (Developer: Nicho)
    app.get('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[GET] /api/locations/:id_start/locations/:id_end');
        Relationship.get(req.params.id_start, req.params.id_end, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.5 Edit a Relationship between two Locations (Developer: Nicho)
    app.put('/api/locations/:id_start/locations/:id_end', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[PUT] /api/locations/:id_start/locations/:id_end');
        Relationship.save(req.params.id_start, req.params.id_end, req.body, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.2.6 Remove a Relationship by its Id (Developer: Nicho)
    app.delete('/api/relationship/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[DELETE] /api/relationships/:id');
        Relationship.delete(req.params.id, function(err, relationship) {
            if (!err) {
                send.data(res, JSON.stringify(relationship));
            } else {
                send.error(res, err);
            }
        });
    });

};
