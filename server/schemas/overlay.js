/*********************************************************************************************
 JSON-Schemas for validating received data
 *********************************************************************************************/

 var postOverlaySchema = {
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
                                    },
                    "sx" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "sy" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "sz" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    }

            },
            "required": ["name", "description", "url", "type", "tags", "w", "h", "x", "y", "z", "d", "rx", "ry", "rz"],
            "additionalProperties": false
};

var putOverlaySchema = {
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
                                    },
                    "sx" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "sy" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    },
                    "sz" :           {
                                        "type": "number",
                                        "minLength":1,
                                        "default": 0
                                    }
            },
            "additionalProperties": false
};

exports.postOverlay = postOverlaySchema;
exports.putOverlay = putOverlaySchema;
