var bunyan = require('bunyan');
var log = bunyan.createLogger({
    name: 'iPED Toolkit',
    level: 'info'
});
module.exports = log;
