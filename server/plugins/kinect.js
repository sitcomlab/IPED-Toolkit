var log = require('../global/log');
var dgram = require('dgram');

function Kinect(options) {
    var thiz = this;
    
    this.port = 33333;
    this.host = '127.0.0.1';
    this.wsHTTP = options.wsHTTP || null;
    this.udpServer = dgram.createSocket('udp4');
    
    this.udpServer.on('listening', function () {
        log.debug('Kinect UDP server listening on port %s', thiz.port);
    });
    
    this.udpServer.on('message', function (message, remote) {
        log.debug({remote: remote, message: message}, 'Received UDP message');
        if (thiz.wsHTTP !== null) {
            if(message == 'up') {
                thiz.wsHTTP.emit('[MIA]moveAvatarUp', '');
            } else if(message == 'down') {
                thiz.wsHTTP.emit('[MIA]moveAvatarDown', '');
            } else if(message == 'left') {
                thiz.wsHTTP.emit('[MIA]moveAvatarLeft', '');
            } else if(message == 'right') {
                thiz.wsHTTP.emit('[MIA]moveAvatarRight', '');
            }
        }
    });
    
    this.udpServer.bind(this.port);
}

module.exports = Kinect;
