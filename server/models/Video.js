var _ = require('underscore');
var util = require('util');
var events = require('events');

var db = require('../global/db');
var log = require('../global/log');

// The model for a video
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

Video.prototype.toJSON = function() {
    return JSON.parse(JSON.stringify({
        id: this.id,
        name: this.name,
        description: this.description,
        date: this.date,
        url: this.url,
        tags: this.tags
    })); 
};

// Static functions
Video.get = function(opts) {
    db.getNodeById(opts.id, function(err, node) {
       if (err) return opts.callback(err);
       opts.callback(null, new Video(node)); 
    });
};

Video.getAll = function(opts) {
    var query = [
    'MATCH (video:Video)',
    'RETURN video'
    ].join('\n');
    
    db.query(query, null, function(err, results) {
        if (err) return opts.callback(err);
        var videos = results.map(function(result) {
            return new Video(result['video']);
        });
        opts.callback(null, videos);   
    });
};

module.exports = Video;