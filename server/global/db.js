var neo4j = require('neo4j');
var log = require('./log');

var NEO4J_PORT = 7474;
var NEO4J_HOST = 'http://localhost';

// Pass console parameters (e.g., server port passed by Jenkins)
process.argv.forEach(function(val, index, array) {
    if (val.indexOf('neo4j_port=') != -1) {
        NEO4J_PORT = val.split('=')[1];
    }
    if (val.indexOf('neo4j_host=') != -1) {
        NEO4J_HOST = val.split('=')[1];
    }
});

var db = new neo4j.GraphDatabase(NEO4J_HOST + ':' + NEO4J_PORT);
log.info('Established Neo4j connection to ' + NEO4J_HOST + ':' + NEO4J_PORT);

module.exports = db;
