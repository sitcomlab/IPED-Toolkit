var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'iPED Toolkit',
    level: 'debug'
});
module.exports = log;
