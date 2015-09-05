var log = require('../global/log');
var db = require('../global/db');

function VoiceControl(options) {
}

VoiceControl.prototype.listenTo = function(options) {
    var wsHTTP = options.wsHTTP;
    var socket = options.socket;
        
    // RESET FOR MICROPHONE-PERMISSION IN FRONDEND
    socket.on('resetFrontendMicPermission', function(data) {
        log.debug({data: data}, 'resetFrontendMicPermission:');
        wsHTTP.emit('[VoiceControl]setMicPermission', data);
    });

    // GET MICROPHONE-PERMISSION IN FRONTEND
    socket.on('getFrontendMicPermission', function() {
        log.debug('getFrontendMicPermission');
        var data = null;
        wsHTTP.emit('[VoiceControl]getMicPermission', data);
        wsHTTP.emit('[VoiceControl]getSelectedLanguage', data);
    });

    // SETUP-FUNCTION IN REMOTE-CONTROL-APP (ACTIVATES MIRCOPHONE IN FRONTEND WITH SELECTED LANGUAGE)
    socket.on('activateMic', function(data) {
        log.debug({data: data}, 'Setup Microphone using language:');
        wsHTTP.emit('[VoiceControl]setupMic', data);
    });

    // RECIEVES MICROPHONE-PERMISSION FROM FRONTEND FOR FINISHING SETUP-PROCESS IN REMOTE-CONTROL-APP
    socket.on('setRemoteMicPermission', function(data) {
        log.debug({data: data}, 'setRemoteMicPermission to:');
        wsHTTP.emit('[VoiceControl]setMicPermission', data);
    });

    // RECIEVES SELECTED MICROPHONE-LANGUAGE FROM FRONTEND
    socket.on('setSeletedLanguage', function(data) {
        log.debug({data: data}, 'setRemoteSelectedLanguage to:');
        wsHTTP.emit('[VoiceControl]setRemoteSelectedLanguage', data);
    });

    // RECIEVES MICROPHONE-LISTENING-STATUS FROM REMOTE-CONTROL-APP (1=START RECORDING; 0=STOP RECORDING) TO RECORD VOICE-COMMAND IN FRONTEND
    socket.on('listen', function(data) {
        log.debug({data: data}, 'Microphone listening:');
        wsHTTP.emit('[VoiceControl]listenMic', data);
    });

    //  RECIEVES WIT.AI RESPONSE WITH RECOGNIZED COMMAND (=INTENT) IN FRONTEND AND STARTS ALGORITHM TO FIND INTENT IN DATABASE
    socket.on('witResponse', function(data) {
        log.debug({data: data}, 'witResponse:');
        this.checkVoiceCommand(data, function(err, res) {
            if(!err && typeof res == "number") {
                data.success = true;
                log.debug({data: res}, "relatedLocationID for emit:");
                data.id = res;
                wsHTTP.emit('[VoiceControl]setLocationId', data);
            } else if (!err && typeof res == "string"){
                if(res == "sys_show_overlays") {
                    wsHTTP.emit('[VoiceControl]changeShowHideOverlays', true);
                    wsHTTP.emit('[VoiceControl]setShowHideOverlays', true);
                } else if(res == "sys_hide_overlays") {
                    wsHTTP.emit('[VoiceControl]changeShowHideOverlays', false);
                    wsHTTP.emit('[VoiceControl]setShowHideOverlays', false);
                } else {
                    data.success = false;
                    data.errMsg = res;
                    wsHTTP.emit('[VoiceControl]failed', data);
                    wsHTTP.emit('[VoiceControl]logger', data);
                }
            }
        });
    });    
};

VoiceControl.prototype.checkVoiceCommand = function(data, callback) {
    var errMsg = "";

    if (data.msg_body === "" || data.msg_body === null) {
        errMsg = "Voice command failed: Wit.Ai couldn't recognize an input!";
        log.error(errMsg);
        callback(null, errMsg);
        return;
    }  else if (data.outcome.intent === undefined || data.outcome.intent === null || data.outcome.intent =='{}') {
        errMsg = "Voice command failed: Wit.Ai couldn't recognize an intent!";
        log.error(errMsg);
        callback(null, errMsg);
        return;
    } else if (data.locationID === null) {
        errMsg = "Voice command failed: No Start Location selected!";
        log.error(errMsg);
        callback(null, errMsg);
        return;
    } else {

        // Check Confidence of wit.ai Results
        if(data.outcome.confidence) {

            if(data.outcome.confidence < 0.05) {
                //var errMsg = "Voice command failed: Could not interpret user input. Confidence is under 50%!";
                errMsg = "Voice command failed: Could not interpret user input. Confidence is under 5%!";
                log.error(errMsg);
                callback(null, errMsg);
                return;
            } else {
                log.debug({data: data.outcome.confidence}, "Confidence accepted: " );
            }
        }

        /**
         *  Check if System-function
         */

        // Check if the submitted intend was a previoud step command, else continue procedure
        if(data.outcome.intent == "sys_previous_location") {
            if(data.previousLocationID === null){
                errMsg = "Could not load previous Location because it doesn't exist at the moment!";
                log.error(errMsg);
                callback(null, errMsg);
                return;
            } else {
                log.debug({data: data.previousLocationID}, "Load previous Location:");
                var relatedLocationID = data.previousLocationID;
                callback(null, data.previousLocationID);
                return;
            }
        }

        // sys_show_overlays
        if(data.outcome.intent == "sys_show_overlays") {

            log.debug("Intent recognized: sys_show_overlays");
            callback(null, "sys_show_overlays");
            return;
        }

        // sys_hide_overlays
        if(data.outcome.intent == "sys_hide_overlays") {

            log.debug("Intent recognized: sys_hide_overlays");
            callback(null, "sys_hide_overlays");
            return;
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
                    if (result[i].intents === null) {
                    // else check for each intent in current relationship, if an intent was in the wit.ai Results
                    } else {
                        for(var j=0; j<result[i].intents.length; j++) {
                            if(result[i].intents[j] == data.outcome.intent){
                                log.info("Intent found in Location: " + result[i].relatedLocationID +
                                    "; " + result[i].intents[j] + " = " + data.outcome.intent );
                                callback(null, result[i].relatedLocationID);
                                return;
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
};

module.exports = VoiceControl;
