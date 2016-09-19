module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    var Overlay = require('../models/Overlay');

    // 3.3.1 List all Overlays (Developer: Tobi)
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

    // 3.3.2 Create an Overlay (Developer: Tobi)
    app.post('/api/overlays', function(req, res) {
        req.log.info('[POST] /api/overlays');
        Overlay.create(req.body, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.3 Retrieve an Overlay (Developer: Tobi)
    app.get('/api/overlays/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[GET] /api/overlays/:id');
        Overlay.get(req.params.id, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.4 Edit an Overlay (Developer: Tobi)
    app.put('/api/overlays/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[PUT] /api/overlays/:id');
        Overlay.save(req.params.id, req.body, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.5 Remove an Overlay (Developer: Tobi)
    app.delete('/api/overlays/:id', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[DELETE] /api/overlays/:id');
        Overlay.delete(req.params.id, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.6 Retrieve all Overlays of a Location (Developer: Nicho)
    app.get('/api/locations/:id/overlays', function(req, res) {
        req.log.info({
            PARAMS: req.params
        }, '[GET] /api/locations/:id/overlays');
        Overlay.getAllRelatedOverlays(req.params.id, function(err, overlay) {
            if (!err) {
                send.data(res, JSON.stringify(overlay));
            } else {
                send.error(res, err);
            }
        });
    });

};
