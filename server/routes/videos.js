module.exports = function(app) {
    var log = require('../global/log');
    var send = require('../global/send');
    var Video = require('../models/Video');

    // 3.3.1 List all Videos (Developer: Nicho)
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

    // 3.3.2 Create a Video (Developer: Nicho)
    app.post('/api/videos', function(req, res) {
        req.log.info('[POST] /api/video');
        Video.create(req.body, function(err, video) {
           if (!err) {
               send.data(res, JSON.stringify(video));
           } else {
               send.error(res, err);
           }
        });
    });

    // 3.3.3 Retrieve a Video (Developer: Nicho)
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

    // 3.3.4 Edit a Video (Developer: Nicho)
    app.put('/api/videos/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[PUT] /api/videos/:id');
        Video.save(req.params.id, req.body, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.5 Remove a Video (Developer: Nicho)
    app.delete('/api/videos/:id', function(req, res) {
        req.log.info({PARAMS: req.params}, '[DELETE] /api/video/:id');
        Video.delete(req.params.id, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);
            }
        });
    });

    // 3.3.6 Retrieve all Videos of a Location (Developer: Nicho)
    app.get('/api/locations/:id/videos', function(req, res) {
        req.log.info({PARAMS: req.params}, '[GET] /api/locations/:id/videos');
        Video.getAllRelatedVideos(req.params.id, function(err, video) {
            if (!err) {
                send.data(res, JSON.stringify(video));
            } else {
                send.error(res, err);
            }
        });
    });

};
