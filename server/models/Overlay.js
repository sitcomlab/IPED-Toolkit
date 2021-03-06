var _ = require('underscore');
var util = require('util');
var events = require('events');

var db = require('../global/db');
var log = require('../global/log');
var nodeLoader = require('../global/nodeLoader');

var JaySchema = require('jayschema');
var prettifyJaySchema = require('jayschema-error-messages');
var validator = require('validator');
var overlaySchema = require('../schemas/overlay');



/**
 * [Overlay description]
 * @param {[type]} overlay [description]
 */
function Overlay(overlay) {
    events.EventEmitter.call(this);

    this.id = overlay.id;
    this.name = overlay.data.name;
    this.description = overlay.data.description;
    this.tags = _.clone(overlay.data.tags);
    this.type = overlay.data.type;
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

/**
 * [toJSON description]
 * @return {[type]} [description]
 */
Overlay.prototype.toJSON = function() {

    return JSON.parse(JSON.stringify({
        id: Number(this.id),
        name: this.name,
        description: this.description,
        tags: this.tags,
        type: this.type,
        url: this.url,
        w: Number(this.w),
        h: Number(this.h),
        x: Number(this.x),
        y: Number(this.y),
        z: Number(this.z),
        d: Number(this.d),
        rx: Number(this.rx),
        ry: Number(this.ry),
        rz: Number(this.rz)
    }));
};


/**
 * [get description]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Overlay.get = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (overlay:Overlay)',
        'WHERE id(overlay)=' + id,
        'AND overlay:Overlay',
        'RETURN overlay'
    ].join('\n');

    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        if (result.length === 0) {
            return callback(new Error('No overlay found with that ID'));
        } else {
            var overlay = new Overlay(result[0]['overlay']);
            callback(null, overlay);
        }
    });
};

/**
 * [getAll description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Overlay.getAll = function(callback) {
    var query = [
        'MATCH (overlay:Overlay)',
        'RETURN overlay'
    ].join('\n');

    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        var overlays = result.map(function(result) {
            return new Overlay(result['overlay']);
        });
        callback(null, overlays);
    });
};

/**
 * [create description]
 * @param  {[type]}   data     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Overlay.create = function(data, callback) {
    js = new JaySchema();
    js.validate(data, overlaySchema.postOverlay, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }

        var query = [
            'CREATE (overlay:Overlay {data})',
            'RETURN overlay'
        ].join('\n');
        var params = {
            data: {
                name: data.name,
                description: data.description,
                tags: data.tags,
                type: data.type,
                url: data.url,
                w: data.w,
                h: data.h,
                x: data.x,
                y: data.y,
                z: data.z,
                d: data.d,
                rx: data.rx,
                ry: data.ry,
                rz: data.rz
            }
        };

        db.query(query, params, function(err, result) {
            if (err)
                return callback(err);
            Overlay.update(result, data, callback);
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
Overlay.save = function(id, data, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    js = new JaySchema();
    js.validate(data, overlaySchema.putOverlay, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }

        Overlay.get(id, function(err, overlay) {
            if (err)
                return callback(err);
            var query = [
                'MATCH (overlay:Overlay)',
                'WHERE id(overlay)=' + id,
                'AND overlay:Overlay',
                'SET overlay += {data}',
                'RETURN overlay'
            ].join('\n');
            var params = {
                data: {
                    name: data.name,
                    description: data.description,
                    tags: data.tags,
                    type: data.type,
                    url: data.url,
                    w: data.w,
                    h: data.h,
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    d: data.d,
                    rx: data.rx,
                    ry: data.ry,
                    rz: data.rz
                }
            };

            db.query(query, params, function(err, result) {
                if (err)
                    return callback(err);
                Overlay.update(result, data, callback);
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
Overlay.update = function(result, data, callback) {
    var overlay = new Overlay(result[0]['overlay']);

    callback(null, overlay);
};

/**
 * [delete description]
 * @param  {[type]}   id       [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Overlay.delete = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (me:Overlay)',
        'WHERE id(me)=' + id,
        'AND me:Overlay',
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
Overlay.getAllRelatedOverlays = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (location:Location)',
        '<-[r:locatedAt]-',
        '(overlay:Overlay)',
        'WHERE id(location)=' + id,
        'RETURN overlay'
    ].join('\n');

    db.query(query, null, function(err, results) {
        if (err) return callback(err);
        var overlays = results.map(function(result) {
            return new Overlay(result['overlay']);
        });
        callback(null, overlays);
    });
};

module.exports = Overlay;
