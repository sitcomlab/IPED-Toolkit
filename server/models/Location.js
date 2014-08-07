var _ = require('underscore');
var util = require('util');
var events = require('events');

var db = require('../global/db');
var log = require('../global/log');

var Video = require('./Video');
var Overlay = require('./Overlay');

// The model for a location
function Location(location) {
    events.EventEmitter.call(this);
    
    this.id = location.id;
    this.name = location.data.name;
    this.description = location.data.description;
    this.tags = _.clone(location.data.tags);
    this.lat = location.data.lat;
    this.lon = location.data.lon;
    this.relatedLocations = [];
    this.videos = [];
    this.overlays = [];
}
util.inherits(Location, events.EventEmitter);

Location.prototype.toJSON = function() {
    return JSON.parse(JSON.stringify({
        id: this.id,
        name: this.name,
        description: this.description,
        tags: this.tags,
        lat: this.lat,
        lon: this.lon,
        relatedLocations: this.relatedLocations,
        videos: this.videos,
        overlays: this.overlays
    })); 
};

Location.prototype.load = function() {
    var thiz = this;
    this.getRelatedLocations(function(err) {
        if (!err) {
            thiz.getVideos(function(err) {
                if (!err) {
                    thiz.getOverlays(function(err) {
                        if (!err) {
                            log.debug('Location completely loaded');
                            thiz.emit('loaded');   
                        } else {
                            log.error({error: err}, 'Error while loading overlays');
                        }
                    });   
                } else {
                    log.error({error: err}, 'Error while loading videos');
                }
            });   
        } else {
            log.error({error: err}, 'Error while loading related locations');
        }
    });
};

Location.prototype.getRelatedLocations = function(callback) {
    var thiz = this;
    var query = [
    'MATCH (me:Location)',
    '-[r:relatedTo]->',
    '(location:Location)',
    'WHERE id(me)=' + this.id,
    'RETURN location'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        thiz.relatedLocations = [];
        var locations = results.map(function(result) {
            var location = new Location(result['location']);
            thiz.relatedLocations.push(location.id);
        });
        callback();
    });
};

Location.prototype.getVideos = function(callback) {
    var thiz = this;
    var query = [
    'MATCH (location:Location)',
    '<-[r:wasRecordedAt]-',
    '(video:Video)',
    'WHERE id(location)=' + this.id,
    'RETURN video'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        thiz.videos = [];
        var videos = results.map(function(result) {
            var video = new Video(result['video']);
            thiz.videos.push(video.id);
        });
        callback();
    });
};

Location.prototype.getOverlays = function(callback) {
    var thiz = this;
    var query = [
    'MATCH (location:Location)',
    '<-[r:locatedAt]-',
    '(overlay:Overlay)',
    'WHERE id(location)=' + this.id,
    'RETURN overlay'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        thiz.overlays = [];
        var overlay = results.map(function(result) {
            var overlay = new Overlay(result['overlay']);
            thiz.overlays.push(overlay.id);
        });
        callback();
    });
};

// Static functions
Location.get = function(id, callback) {
    db.getNodeById(id, function(err, node) {
       if (err) return callback(err);
       callback(null, new User(node)); 
    });
};

Location.getAll = function(callback) {
    var query = [
    'MATCH (location:Location)',
    'RETURN location'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        var locations = results.map(function(result) {
            return new Location(result['location']);
        });
        
        var locationsNumber = locations.length;
        var locationsLoaded = 0;
        locations.forEach(function(location) {
            location.on('loaded', function() {
                log.debug('%d of %d locations loaded', locationsLoaded+1, locationsNumber);
                if ((++locationsLoaded) == locationsNumber) {
                    log.debug({locations: locations}, 'Done loading all locations');
                    callback(null, locations);
                }
            });
            location.load();    
        });
    });
};

module.exports = Location;