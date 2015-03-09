var log = require('./log');

/**
* Turns "shallow" nodes into "deep" nodes by calling their .load method.
*/
exports.loadAll = function(nodes, callback) {
    if (nodes.length == 0) return callback(null, nodes);
    
    var nodesNumber = nodes.length;
    var nodesLoaded = 0;
    nodes.forEach(function(node) {
        node.on('loaded', function() {
            log.debug('%d of %d nodes loaded', nodesLoaded+1, nodesNumber);
            if ((++nodesLoaded) == nodesNumber) {
                log.debug({node: nodes}, 'Done loading all nodes');
                callback(null, nodes);
            }
        });
        node.load();    
    });
};

/**
* Turns a "shallow" node into "deep" node by calling its .load method.
*/
exports.load = function(node, callback) {
    node.on('loaded', function() {
        log.debug({node: node}, 'Done loading node');
        callback(null, node);
    });
    node.load();
};