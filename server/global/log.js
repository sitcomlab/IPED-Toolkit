var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'IPED Toolkit',
    level: 'debug'
});
module.exports = log;
