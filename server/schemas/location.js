/*********************************************************************************************
 JSON-Schemas for validating received data
 *********************************************************************************************/

var postLocationSchema = {
    "title": "postLocationSchema",
    "description": "A JSON-Schema to validate recieving Locations for POST-request",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 1
        },
        "description": {
            "type": "string"
        },
        "tags": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "lat": {
            "type": "number"
        },
        "lon": {
            "type": "number"
        },
        "relatedLocations": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "videos": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "overlays": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        }
    },
    "required": ["name", "description", "tags", "lat", "lon", "relatedLocations", "videos", "overlays"],
    "additionalProperties": false
};

var putLocationSchema = {
    "title": "putLocationSchema",
    "description": "A JSON-Schema to validate recieving Locations for PUT-request",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "minLength": 1
        },
        "name": {
            "type": "string",
            "minLength": 1
        },
        "description": {
            "type": "string"
        },
        "tags": {
            "type": "array",
            "items": {
                "type": "string",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "lat": {
            "type": "number"
        },
        "lon": {
            "type": "number"
        },
        "relatedLocations": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "videos": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        },
        "overlays": {
            "type": "array",
            "items": {
                "type": "integer",
                "minLength": 1
            },
            "uniqueItems": true
        }
    },
    "additionalProperties": false
};

exports.postLocation = postLocationSchema;
exports.putLocation = putLocationSchema;
