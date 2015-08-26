var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'IPED Toolkit',
    level: 'info'
});
module.exports = log;
