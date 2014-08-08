var _ = require('underscore');
var util = require('util');
var events = require('events');
var async = require('async');

var db = require('../global/db');
var log = require('../global/log');
var nodeLoader = require('../global/nodeLoader');

var Video = require('./Video');
var Overlay = require('./Overlay');

var JaySchema = require('jayschema');
var prettifyJaySchema = require('jayschema-error-messages');
var validator = require('validator');
var locationSchema = require('../schemas/location');

// The model for a location
function Location(location) {
    events.EventEmitter.call(this);
    
    this.id = location.id;
    this.name = location.data.name;
    this.description = location.data.description;
    this.tags = _.clone(location.data.tags);
    this.lat = location.data.lat;
    this.lon = location.data.lon;
    this.relatedLocations = location.data.relatedLocations;
    this.videos = location.data.videos;
    this.overlays = location.data.overlays;
}
util.inherits(Location, events.EventEmitter);

/**
* Converts a location into JSON.
* Required since Location inherits unnwanted attributes from EventEmitter
* that would also be sent to the client in the default implementation of this function.
*/
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

/**
* Load all external references of this location, e.g., videos or overlays.
*/
Location.prototype.load = function() {
    var thiz = this;
    
    async.parallel([
        function(callback) { thiz.getRelatedLocations(callback); },
        function(callback) { thiz.getVideos(callback); },
        function(callback) { thiz.getOverlays(callback); },
    ], function(err, result) {
        if (err) {
            log.error({error: err}, 'Error while loading location');
            return;
        }
        thiz.emit('loaded');
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
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        thiz.relatedLocations = [];
        var locations = result.map(function(result) {
            var location = new Location(result['location']);
            thiz.relatedLocations.push(location.id);
        });
        callback();
    });
};

Location.prototype.setRelatedLocations = function(relatedLocations, callback) {
    var query = [
    'MATCH (me:Location), (location:Location)',
    'WHERE id(me)=' + this.id,
    'AND id(location) IN [' + relatedLocations.toString() + ']',
    'CREATE (me)-[:relatedTo]->(location)'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
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
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        thiz.videos = [];
        var videos = result.map(function(result) {
            var video = new Video(result['video']);
            thiz.videos.push(video.id);
        });
        callback();
    });
};

Location.prototype.setVideos = function(videos, callback) {
    var query = [
    'MATCH (me:Location), (video:Video)',
    'WHERE id(me)=' + this.id,
    'AND id(video) IN [' + videos.toString() + ']',
    'CREATE (me)<-[:wasRecordedAt]-(video)'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
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
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        thiz.overlays = [];
        var overlay = result.map(function(result) {
            var overlay = new Overlay(result['overlay']);
            thiz.overlays.push(overlay.id);
        });
        callback();
    });
};

Location.prototype.setOverlays = function(overlays, callback) {
    var query = [
    'MATCH (me:Location), (overlay:Overlays)',
    'WHERE id(me)=' + this.id,
    'AND id(overlay) IN [' + overlays.toString() + ']',
    'CREATE (me)<-[:locatedAt]-(overlay)'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        callback();
    });
};

/**
* Static function to get a single location instance.
* @param id - The ID of the location to be fetched
* @param callback - The function to call once the fetch is done
*/
Location.get = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }
    
    var query = [
    'MATCH (location:Location)',
    'WHERE id(location)=' + id,
    'AND location:Location',
    'RETURN location'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        var locations = result.map(function(result) {
            return new Location(result['location']);
        });
        if (locations.length == 0) {
            return callback(new Error('No location found with that ID'));
        } else {
            nodeLoader.loadAll(locations, callback);
        }
    });
};

/**
* Static function to get all locations.
* @param callback - The function to call once the fetch is done
*/
Location.getAll = function(callback) {
    var query = [
    'MATCH (location:Location)',
    'RETURN location'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        var locations = result.map(function(result) {
            return new Location(result['location']);
        });
        nodeLoader.loadAll(locations, callback);
    });
};

/**
* Creates a new location object and saves it in the database
* @param data - The data to populate the new location
* @param callback - The function to call once the new location has been saved to the database
*/
Location.create = function(data, callback) {
    js = new JaySchema();
    js.validate(data, locationSchema.postLocation, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }
        
        var query = [
        'CREATE (location:Location {data})',
        'RETURN location'
        ].join('\n');
        var params = {
            data: {
                name: data.name,
                description: data.description,
                tags: data.tags,
                lat: data.lat,
                lon: data.lon
            }
        };
    
        db.query(query, params, function(err, result) {
           if (err) return callback(err);
           var location = new Location(result[0]['location']);
           var relatedLocations = new Location({data: data}).relatedLocations;
           var videos = new Location({data: data}).videos;
           var overlays = new Location({data: data}).overlays;
           
           async.parallel([
               function(callback) { location.setRelatedLocations(relatedLocations, callback); },
               function(callback) { location.setVideos(videos, callback); },
               function(callback) { location.setOverlays(overlays, callback); }
           ], function(err, result) {
               if (err) return callback(err);
               nodeLoader.load(location, callback); 
           });
        }); 
    });
};

module.exports = Location;