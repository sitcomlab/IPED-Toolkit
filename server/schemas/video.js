/*********************************************************************************************
 JSON-Schemas for validating received data
 *********************************************************************************************/

var postVideoSchema = {
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

var putVideoSchema = {
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

exports.postVideo = postVideoSchema;
exports.putVideo = putVideoSchema;