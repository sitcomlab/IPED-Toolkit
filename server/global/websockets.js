var socketio = require('socket.io');
var log = require('./log');

function Websockets(options) {
    this.wsHTTP  = socketio.listen(options.httpServer);
    this.wsHTTPS = socketio.listen(options.httpsServer);
}

Websockets.prototype.on = function(event, handler) {
    this.wsHTTP.on(event, handler);
    this.wsHTTPS.on(event, handler);
};

Websockets.prototype.emit = function(event, data) {
    this.wsHTTP.emit(event, data);
    this.wsHTTPS.emit(event, data);
};

module.exports = Websockets;
