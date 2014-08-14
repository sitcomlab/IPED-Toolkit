var log = require('./log');

exports.data = function(res, data) {
    log.info({data: data}, 'Sending data');
    res.writeHead(200, {
        'Content-Type' : 'application/json'
    });
    res.end(data);
};

exports.error = function(res, err) {
    log.error({error: err}, '%s', err.toString());
    res.writeHead(500, {
        'Content-Type' : 'text/plain'
    });
    res.end(err.toString());
};