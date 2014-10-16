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



// The model for a overlay
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

Overlay.prototype.toJSON = function() {

	return JSON.parse(JSON.stringify({
		id : new Number(this.id),
		name : this.name,
		description : this.description,
		tags : this.tags,
		type : this.type,
		url : this.url,
		w : new Number(this.w),
		h : new Number(this.h),
		x : new Number(this.x),
		y : new Number(this.y),
		z : new Number(this.z),
		d : new Number(this.d),
		rx : new Number(this.rx),
		ry : new Number(this.ry),
		rz : new Number(this.rz)
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
        if (result.length == 0) {
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
 * Creates a new overlay object and saves it in the database
 * @param data - The data to populate the new overlay
 * @param callback - The function to call once the new overlay has been saved to the database
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
			data : {
				name : data.name,
				description : data.description,
				tags : data.tags,
				type : data.type,
				url : data.url,
				w : data.w,
				h : data.h,
				x : data.x,
				y : data.y,
				z : data.z,
				d : data.d,
				rx : data.rx,
				ry : data.ry,
				rz : data.rz
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
 * Saves changes to an existing overlay object to the database
 * @param id - The ID of the overlay to save
 * @param data - The data for the overlay
 * @param callback - The function to call once the overlay has been saved to the database
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
				data : {
					name : data.name,
					description : data.description,
					tags : data.tags,
					type : data.type,
					url : data.url,
					w : data.w,
					h : data.h,
					x : data.x,
					y : data.y,
					z : data.z,
					d : data.d,
					rx : data.rx,
					ry : data.ry,
					rz : data.rz
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
* Deletes an overlay from the DB
* @param id - The ID of the overlay to be deleted
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

module.exports = Overlay;
