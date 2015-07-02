/*********************************************************************************************
 JSON-Schemas for validating received data
 *********************************************************************************************/

var postRelationshipSchema = {
            "title": "postRelationshipSchema",
            "description": "A JSON-Schema to validate recieving Relationships for POST-request",
            "type": "object",
            "properties" : {
                    "intents" :        {
                                        "type": "array",
                                        "items": {
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
                                    }
            },
            "required": ["intents"],
            "additionalProperties": false
};

var putRelationshipSchema = {
            "title": "putRelationshipSchema",
            "description": "A JSON-Schema to validate recieving Relationships for PUT-request",
            "type": "object",
            "properties" : {
                    "id" :          {
                                        "type": "integer",
                                        "minLength":1
                                    },
                    "intents" :        {
                                        "type": "array",
                                        "items": {
                                            "type": "string",
                                            "minLength":1
                                        },
                                        "uniqueItems": true
            },
            "additionalProperties": false
        }
};

exports.postRelationship = postRelationshipSchema;
exports.putRelationship = putRelationshipSchema;
