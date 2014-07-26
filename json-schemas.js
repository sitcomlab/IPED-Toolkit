/*********************************************************************************************
 JSON-Schemas for validating received data
 *********************************************************************************************
 
 Table of content
 ---------------------------------------

1. Location-Schema
    1.1 For "Create a Location"
    1.2 For "Edit a Location"
2. Video-Schema
    2.1 For "Create a Video"
    2.2 For "Edit a Video"
3. Overlay-Schema
    3.1 For "Create an Overlay"
    3.2 For "Edit an Overlay"

 *********************************************************************************************/

// Function to get a schema in server.js (Developer: Nicho)
exports.getSchema = function (i) {

    // 1.1 For "Create a Location"
    if(i=='postLocationSchema') {
        return {
            "title": "postLocationSchema",
            "description": "A JSON-Schema to validate recieving Locations for POST-request",
            "type": "object", 
            "properties" : {
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "lat" :         {
                                        "type": "number"
                                    },
                    "lon" :         {
                                        "type": "number"
                                    },
                    "relatedLocations": { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "videos":       {
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "overlays":     {
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    }
            },
            "required": ["name", "description", "tags", "lat", "lon", "relatedLocations", "videos", "overlays"],
            "additionalProperties": false
        };
    }

    // 1.2 For "Edit a Location"
    if(i=='putLocationSchema') {
        return {
            "title": "putLocationSchema",
            "description": "A JSON-Schema to validate recieving Locations for PUT-request",
            "type": "object", 
            "properties" : {
                    "id" :          {
                                        "type": "integer",
                                        "minLength":1
                                    }, 
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "lat" :         {
                                        "type": "number"
                                    },
                    "lon" :         {
                                        "type": "number"
                                    },
                    "relatedLocations": { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "videos":       {
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "overlays":     {
                                        "type": "array", 
                                        "items": { 
                                            "type": "integer",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    }
            },
            "additionalProperties": false
        };
    }

    // 2.1 For "Create a Video"
    if(i=='postVideoSchema') {
        return {
            "title": "postVideoSchema",
            "description": "A JSON-Schema to validate recieving Videos for POST-request",
            "type": "object", 
            "properties" : {
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "url" :         { 
                                        "type": "string", 
                                        "format": "uri",
                                        "minLength":1
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "date" :        {
                                        "type": "string"
                                    }
            },
            "required": ["name", "description", "url", "tags", "date"],
            "additionalProperties": false
        };
    }

    // 2.2 For "Edit a Video"
    if(i=='putVideoSchema') {
        return {
            "title": "putVideoSchema",
            "description": "A JSON-Schema to validate recieving Videos for PUT-request",
            "type": "object", 
            "properties" : {
                    "id" :          {
                                        "type": "integer",
                                        "minLength":1
                                    },
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "url" :         { 
                                        "type": "string", 
                                        "format": "uri",
                                        "minLength":1
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "date" :        {
                                        "type": "string"
                                    }
            },
            "additionalProperties": false
        };
    }

    // 3.1 For "Create an Overlay"
    if(i=='postOverlaySchema') {
        return {
            "title": "postOverlaySchema",
            "description": "A JSON-Schema to validate recieving Overlays for POST-request",
            "type": "object", 
            "properties" : {
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "url" :         { 
                                        "type": "string", 
                                        "format": "uri",
                                        "minLength":1
                                    },
                    "type" :        { 
                                        "enum": [ "html", "video", "image" ] 
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "w" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "h" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "x" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "y" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "z" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "d" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "rx" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "ry" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "rz" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    }
            },
            "required": ["name", "description", "url", "type", "tags", "w", "h", "x", "y", "z", "d", "rx", "ry", "rz"],
            "additionalProperties": false
        };
    }

    // 3.2 For "Edit an Overlay"
    if(i=='putOverlaySchema') {
        return {
            "title": "putOverlaySchema",
            "description": "A JSON-Schema to validate recieving Overlays for PUT-request",
            "type": "object", 
            "properties" : {
                    "id" :          {
                                        "type": "integer",
                                        "minLength":1
                                    },
                    "name" :        { 
                                        "type": "string",
                                        "minLength":1
                                    },
                    "description" : { 
                                        "type": "string" 
                                    },
                    "url" :         { 
                                        "type": "string", 
                                        "format": "uri",
                                        "minLength":1
                                    },
                    "type" :        { 
                                        "enum": [ "html", "video", "image" ] 
                                    },
                    "tags" :        { 
                                        "type": "array", 
                                        "items": { 
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    },
                    "w" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "h" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "x" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "y" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "z" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "d" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "rx" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "ry" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "rz" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    }
            },
            "additionalProperties": false
        };
    }
};