var _ = require('underscore');
var util = require('util');
var events = require('events');
var async = require('async');

var db = require('../global/db');
var log = require('../global/log');
var nodeLoader = require('../global/nodeLoader');

var JaySchema = require('jayschema');
var prettifyJaySchema = require('jayschema-error-messages');
var validator = require('validator');
var relationshipSchema = require('../schemas/relationship');

// The model for a relationship
function Relationship(relationship) {
    events.EventEmitter.call(this);

    this.id = relationship.id;
    this.intents = _.clone(relationship.data.intents);
}

util.inherits(Relationship, events.EventEmitter);

/**
 * Converts a location into JSON.
 * Required since Location inherits unnwanted attributes from EventEmitter
 * that would also be sent to the client in the default implementation of this function.
 */
 Relationship.prototype.toJSON = function() {
    return JSON.parse(JSON.stringify({
        id: new Number(this.id),
        intents: this.intents
    }));
};

/**
 * Static function to get a single location instance.
 * @param id - The ID of the location to be fetched
 * @param callback - The function to call once the fetch is done
 */
 Relationship.get = function(locationStartID, locationEndID, callback) {
    if (!validator.isInt(locationStartID)) {
        return callback(new Error('Invalid ID'));
    }
    if (!validator.isInt(locationEndID)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (locationStart:Location)-[relationship:relatedTo]->(locationEnd:Location)',
        'WHERE id(locationStart)=' + locationStartID,
        'AND id(locationEnd)=' + locationEndID,
        'RETURN relationship'
    ].join('\n');

    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        if (result.length === 0) {
            return callback(new Error('No relationship found between these IDs'));
        } else {
            var relationship = new Relationship(result[0]['relationship']);
            callback(null, relationship);
        }
    });
};


/**
 * Static function to get a single location instance.
 * @param id - The ID of the location to be fetched
 * @param callback - The function to call once the fetch is done
 */
 Relationship.getById = function(id, callback) {
    if (!validator.isInt(id)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (locationStart:Location)-[relationship:relatedTo]->(locationEnd:Location)',
        'WHERE id(relationship)=' + id,
        'RETURN relationship'
    ].join('\n');

    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        if (result.length === 0) {
            return callback(new Error('No relationship found with this ID'));
        } else {
            var relationship = new Relationship(result[0]['relationship']);
            callback(null, relationship);
        }
    });
};


/**
 * Creates a new location object and saves it in the database
 * @param data - The data to populate the new location
 * @param callback - The function to call once the new location has been saved to the database
 */
 Relationship.create = function(locationStartID, locationEndID, data, callback) {

     if (!validator.isInt(locationStartID)) {
         return callback(new Error('Invalid ID'));
     }
     if (!validator.isInt(locationEndID)) {
         return callback(new Error('Invalid ID'));
     }

    js = new JaySchema();
    js.validate(data, relationshipSchema.postRelationship, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }

        var query = [
            'MATCH (locationStart:Location), (locationEnd:Location)',
            'WHERE id(locationStart)=' + locationStartID,
            'AND id(locationEnd)=' + locationEndID,
            'CREATE (locationStart)-[relationship:relatedTo {data}]->(locationEnd)',
            'RETURN relationship'
        ].join('\n');
        var params = {
            data: {
                intents: data.intents
            }
        };

        db.query(query, params, function(err, result) {
            if (err) return callback(err);
            Relationship.update(result, data, callback);
        });
    });
};

/**
 * Saves changes to an existing location object to the database
 * @param id - The ID of the location to save
 * @param data - The data for the location
 * @param callback - The function to call once the location has been saved to the database
 */
 Relationship.save = function(locationStartID, locationEndID, data, callback) {
     if (!validator.isInt(locationStartID)) {
         return callback(new Error('Invalid ID'));
     }
     if (!validator.isInt(locationEndID)) {
         return callback(new Error('Invalid ID'));
     }

    js = new JaySchema();
    js.validate(data, relationshipSchema.putRelationship, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }

    var query = [
                'MATCH (locationStart:Location)-[relationship:relatedTo]->(locationEnd:Location)',
                'WHERE id(locationStart)=' + locationStartID,
                'AND id(locationEnd)=' + locationEndID,
                'SET relationship += {data}',
                'RETURN relationship'
            ].join('\n');
            var params = {
                data: {

                    intents: data.intents
                }
            };

            db.query(query, params, function(err, result) {
                if (err) return callback(err);
                Relationship.update(result, data, callback);
            });
    });
};


/**
 * Saves changes to an existing location object to the database
 * @param id - The ID of the location to save
 * @param data - The data for the location
 * @param callback - The function to call once the location has been saved to the database
 */
 Relationship.saveById = function(id, data, callback) {
     if (!validator.isInt(id)) {
         return callback(new Error('Invalid ID'));
     }

    js = new JaySchema();
    js.validate(data, relationshipSchema.putRelationship, function(err) {
        if (err) {
            return callback(new Error(JSON.stringify(prettifyJaySchema(err))));
        }

    var query = [
                'MATCH (locationStart:Location)-[relationship:relatedTo]->(locationEnd:Location)',
                'WHERE id(relationship)=' + id,
                'SET relationship += {data}',
                'RETURN relationship'
            ].join('\n');
            var params = {
                data: {

                    intents: data.intents
                }
            };

            db.query(query, params, function(err, result) {
                if (err) return callback(err);
                Relationship.update(result, data, callback);
            });
    });
};



/**
 * Creates a location object from a DB query result and updates its attributes
 * @param result - A location represented as a DB query result
 * @param data - The data for the location
 * @param callback - The function to call once the location has been updated to the database
 */
 Relationship.update = function(result, data, callback) {

    var relationship = new Relationship(result[0]['relationship']);

        callback(null, relationship);
    };

/**
 * Deletes a location from the DB
 * @param id - The ID of the location to be deleted
 */
 Relationship.delete = function(locationStartID, locationEndID, callback) {
    if (!validator.isInt(locationStartID)) {
        return callback(new Error('Invalid ID'));
    }
    if (!validator.isInt(locationEndID)) {
        return callback(new Error('Invalid ID'));
    }

    var query = [
        'MATCH (locationStart:Location)-[relationship:relatedTo]->(locationEnd:Location)',
        'WHERE id(locationStart)=' + locationStartID,
        'AND id(locationEnd)=' + locationEndID,
        'DELETE relationship'
    ].join('\n');

    db.query(query, null, function(err, result) {
        if (err) return callback(err);
        callback(null, null);
    });
};

module.exports = Relationship;
