var log = require('../global/log');
var dgram = require('dgram');

function Mia(options) {
    var thiz = this;

    this.port = 33333;
    this.host = '127.0.0.1';
    this.websockets = options.websockets || null;
    this.udpServer = dgram.createSocket('udp4');

    this.udpServer.on('listening', function () {
        log.debug('MIA UDP server listening on port %s', thiz.port);
    });

    this.udpServer.on('message', function (message, remote) {
        var _message = message.toString();
        log.debug({remote: remote, message: _message}, 'Received UDP message');
        if (thiz.websockets !== null) {
            if (_message.indexOf('[MIA]') === 0) {
                thiz.websockets.emit(_message);
            } else {
                log.error({message: _message}, 'Received an invalid UDP package which has thus been dropped.');
            }
        }
    });

    this.udpServer.bind(this.port);
}

module.exports = Mia;
