var _ = require('underscore');
var util = require('util');
var events = require('events');

var db = require('../global/db');
var log = require('../global/log');

// The model for a overlay
function Overlay(overlay) {
    events.EventEmitter.call(this);
    
    this.id = overlay.id;
    this.name = overlay.data.name;
    this.description = overlay.data.description;
    this.tags = _.clone(overlay.data.tags);
    this.type = overlay.data.type
    this.url = overlay.data.url;
    this.w = overlay.data.w;
    this.h = overlay.data.h;
    this.x = overlay.data.x;
    this.y = overlay.data.y;
    this.z = overlay.data.z;
    this.d = overlay.data.d;
    this.rx = overlay.data.rx;
    this.ry = overlay.data.ry;
    this.rz = overlay.data.rz;
}
util.inherits(Overlay, events.EventEmitter);

Overlay.prototype.toJSON = function() {
    return JSON.parse(JSON.stringify({
        id: this.id,
        name: this.name,
        description: this.description,
        tags: this.tags,
        type: this.type,
        url: this.url,
        w: this.w,
        h: this.h,
        x: this.x,
        y: this.y,
        z: this.z,
        d: this.d,
        rx: this.rx,
        ry: this.ry,
        rz: this.rz
    })); 
};

// Static functions
Overlay.get = function(opts) {
    db.getNodeById(opts.id, function(err, node) {
       if (err) return opts.callback(err);
       opts.callback(null, new Overlay(node)); 
    });
};

Overlay.getAll = function(opts) {
    var query = [
    'MATCH (overlay:Overlay)',
    'RETURN overlay'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return opts.callback(err);
        var overlays = results.map(function(result) {
            return new Overlay(result['overlay']);
        });
        opts.callback(null, overlays);   
    });
};

module.exports = Overlay;