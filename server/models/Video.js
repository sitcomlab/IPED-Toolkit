var _ = require('underscore');
var util = require('util');
var events = require('events');

var db = require('../global/db');
var log = require('../global/log');
var nodeLoader = require('../global/nodeLoader');

var JaySchema = require('jayschema');
var prettifyJaySchema = require('jayschema-error-messages');
var validator = require('validator');
var videoSchema = require('../schemas/video');



/**
 * [Video description]
 * @param {[type]} video [description]
 */
function Video(video) {
    events.EventEmitter.call(this);

    this.id = video.id;
    this.name = video.data.name;
    this.description = video.data.description;
    this.date = video.data.date;
    this.url = video.data.url;
    this.tags = _.clone(video.data.tags);
}

util.inherits(Video, events.EventEmitter);

/**
 * [toJSON description]
 * @return {[type]} [description]
 */
Video.prototype.toJSON = function() {
    return JSON.parse(JSON.stringify({
        id: new Number(this.id),
        name: this.name,
        description: this.description,
        date: this.date,
        url: this.url,
        tags: this.tags
    })); 
};

/**
 * [get description]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.get = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }
    
    var query = [
        'MATCH (video:Video)',
        'WHERE id(video)=' + id,
        'AND video:Video',
        'RETURN video'
    ].join('\n');
    
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        if (result.length == 0) {
            return callback(new Error('No video found with that ID'));
        } else {
            var video = new Video(result[0]['video']);
            callback(null, video);
        }
    });
};

/**
 * [getAll description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.getAll = function(callback) {
    var query = [
        'MATCH (video:Video)',
        'RETURN video'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        var videos = results.map(function(result) {
            return new Video(result['video']);
        });
        callback(null, videos);
    });
};

/**
 * [create description]
 * @param  {[type]}   data     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.create = function(data, callback) {
    js = new JaySchema();
    js.validate(data, videoSchema.postVideo, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }
        
        var query = [
            'CREATE (video:Video {data})',
            'RETURN video'
        ].join('\n');
        var params = {
            data: {
                name: data.name,
                description: data.description,
                tags: data.tags,
                date: data.date,
                url: data.url
            }
        };
    
        db.query(query, params, function(err, result) {
           if (err) return callback(err);
           Video.update(result, data, callback);
        }); 
    });
};

/**
 * [save description]
 * @param  {[type]}   id       [description]
 * @param  {[type]}   data     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.save = function(id, data, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }
    
    js = new JaySchema();
    js.validate(data, videoSchema.putVideo, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }
        
        Video.get(id, function(err, location) {
            if (err) return callback(err);
            var query = [
                'MATCH (video:Video)',
                'WHERE id(video)=' + id,
                'AND video:Video',
                'SET video += {data}',
                'RETURN video'
            ].join('\n');
            var params = {
                data: {
                    name: data.name,
                    description: data.description,
                    tags: data.tags,
                    date: data.date,
                    url: data.url
                }
            };
    
            db.query(query, params, function(err, result) {
               if (err) return callback(err);
               Video.update(result, data, callback);
            });
        });
    });
};

/**
 * [update description]
 * @param  {[type]}   result   [description]
 * @param  {[type]}   data     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.update = function(result, data, callback) {
    var video = new Video(result[0]['video']);

    callback(null, video);
};

/**
 * [delete description]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.delete = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }
    
    var query = [
        'MATCH (me:Video)',
        'WHERE id(me)=' + id,
        'AND me:Video',
        'OPTIONAL MATCH (me)-[r]-()',
        'DELETE r, me'
    ].join('\n');
        
    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        callback(null, null);
    });
};

/**
 * getAllRelatedVideos of a Location
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Video.getAllRelatedVideos = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
    'MATCH (location:Location)',
    '<-[r:wasRecordedAt]-',
    '(video:Video)',
    'WHERE id(location)=' + id,
    'RETURN video'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        var videos = results.map(function(result) {
            return new Video(result['video']);
        });
        callback(null, videos);
    });
};


module.exports = Video;