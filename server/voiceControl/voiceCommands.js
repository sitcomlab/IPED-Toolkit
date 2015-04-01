var log = require('../global/log');
var db = require('../global/db');

var socketio = require('socket.io');


exports.checkVoiceCommand = function(data, callback) {

    if (data.msg_body == "" || data.msg_body == null) {

        var errMsg = "Voice command failed: Wit.Ai couldn't recognize an input!";
        log.error(errMsg);
        callback(null, errMsg);
        return

    }  else if (data.outcome.intent == undefined || data.outcome.intent == null || data.outcome.intent=='{}') {
        
        var errMsg = "Voice command failed: Wit.Ai couldn't recognize an intent!";
        log.error(errMsg);
        callback(null, errMsg);
        return

    } else if (data.locationID == null) {
        
        var errMsg = "Voice command failed: No Start Location selected!";
        log.error(errMsg);
        callback(null, errMsg);
        return

    } else {

        // Check Confidence of wit.ai Results
        if(data.outcome.confidence) {
            
            if(data.outcome.confidence < 0.05) {
                //var errMsg = "Voice command failed: Could not interpret user input. Confidence is under 50%!";
                var errMsg = "Voice command failed: Could not interpret user input. Confidence is under 5%!";
                log.error(errMsg);
                callback(null, errMsg);
                return
            } else {
                log.info("Confidence accepted!");
            }
        }

        // Check if the submitted intend was a previoud step command, else continue procedure
        if(data.outcome.intent == "sys_previous_location") {
            if(data.previousLocationID==null){
                var errMsg = "Could not load previous Location because it doesn't exist at the moment!";
                log.error(errMsg);
                callback(null, errMsg);
                return
            } else {
                log.info("Load previous Location: " + data.previousLocationID);
                var relatedLocationID = data.previousLocationID;
                callback(null, data.previousLocationID);
                return
            }
        }

        // If Confidence is high enough for an understood intent continue with searching this intent in the relationships
        // of the current LocationID in the Database
        
        // Database-Query-Preparation
        var query = [
            'START n=node(' + data.locationID + ')',
            'MATCH n-[r:relatedTo]->m',
            'RETURN ID(m) AS relatedLocationID,r.intents AS intents'
        ].join('\n');
        
        // Database-Query-Executing
        db.query(query, null, function(err, result) {

            if (err) {
                return callback(null, err);
            } else {
                console.log(result);

                // for each result in result
                for(var i=0; i<result.length; i++) {
                    // if no intents foundn in current relationship, continue with next relationship
                    if (result[i].intents == null) {
                    // else check for each intent in current relationship, if an intent was in the wit.ai Results
                    } else {
                        for(var j=0; j<result[i].intents.length; j++) {
                            if(result[i].intents[j] == data.outcome.intent){
                                log.info("Intent found in Location: " + result[i].relatedLocationID + 
                                    "; " + result[i].intents[j] + " = " + data.outcome.intent );
                                callback(null, result[i].relatedLocationID);
                                return
                            } else {
                                log.info("No intent found in Database: " + result[i].intents[j] + " != " + data.outcome.intent);
                            }
                        }   
                    }
                }
            }
            var errMsg = 'Could not find an intent in the database which is equal to the wit.ai intent: "'+ data.outcome.intent +'"';
            callback(null, errMsg);
        });

    }  
}