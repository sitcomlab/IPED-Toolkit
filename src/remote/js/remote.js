/*!
 * The iPED Toolkit
 * Remote
 *
 * (c) 2014 (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 *
 * Voice control
 * (c) 2015 Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

require.config(requireConfig);

var TPL_PATH = 'requirejs/js/text!../remote/templates/';

require(['jsnlog/js/jsnlog.min',
        'jquery/js/jquery.min',
        'socketio/js/socket.io',
        'underscorejs/js/underscore',
        'backbonejs/js/backbone',
        'bootstrap/js/bootstrap.min',

        // Models
        'backend/models/Location',
        'backend/models/Locations',
        'backend/models/Video',
        'backend/models/Videos',

        // Views
        'remote/views/LocationsListView',

    ],

    function(JSNLog, JQuery, io, Underscore, Backbone, Bootstrap, Location, Locations, Video, Videos, LocationsListView) {
        (function setupJSNLog() {
            var consoleAppender = JL.createConsoleAppender('consoleAppender');
            JL()
                .setOptions({
                    'appenders': [consoleAppender],
                    //'level': JL.getOffLevel()
                    'level': JL.getDebugLevel()
                        //'level': JL.getErrorLevel()
                });

            /* This is an example log output:
             JL('iPED Toolkit.Remote').fatal('Something very bad happened!');
             */
        })();

        /**
         * Global variable for Logger
         */
        var counter = 0;

        /**
         * Global variables for micPermission in frontend and selected language
         * @type {Number}
         */
        var micPermission = 0;
        var language = null;

        /**
         * The remote of the iPED Toolkit.
         * @constructor
         */
        function Remote() {
            var thiz = this;

            // variables for voice control
            this.micstatus = 0;

            _.bindAll(this, 'setLocationId', 'fetchRelatedLocations');

            this.socket = io();


            this.socket.on('setMicPermission', function(data) {
                micPermission = data;
                JL('iPED Toolkit.Remote - setMicPermission')
                    .debug(data);

                if (micPermission == 1) {
                    $('#voiceControlPanel')
                        .removeClass("panel-primary");
                    $('#voiceControlPanel')
                        .addClass("panel-success");
                    $('#voiceControlTitle')
                        .html("Voice Control (ready to use)");
                } else {
                    $('#voiceControlPanel')
                        .removeClass("panel-success");
                    $('#voiceControlPanel')
                        .addClass("panel-primary");
                    $('#voiceControlTitle')
                        .html("Voice Control");
                }

            });


            this.socket.on('setRemoteSelectedLanguage', function(data) {
                language = data;
                JL('iPED Toolkit.Remote - setRemoteSelectedLanguage')
                    .debug(data);

                // Select radio button if language was already defined
                if (language != null) {
                    $('input[name="languages"][value=' + language + ']')
                        .prop('checked', true);
                }


            });


            /*
                Logger
                for log all neccessary timeintervals in milliseconds
                (1) user input / recording invertval
                (2) from stop recording to wit.ai response
                (3) from stop recording to wit.ai response and server recieved wit results
                (4) from stop recording to neo4j response
                (5) from step recording to frontend recieved result
                (6) from start recording to frontend recieved result (complete interval)
             */
            this.socket.on('logger', function(data) {
                JL('iPED Toolkit.Remote - Logger')
                    .debug(data);

                counter = counter + 1;


                if (data.success) {
                    $('#logger')
                        .prepend(

                            '<div class="alert alert-success" role="alert"><div class="table-responsive"><table class="logger"><tr><th><u>' + counter + '. Command</u></th><th></th></tr><tr><td><b>Current LocationID: </b>' + data.locationID + '</td><td>' + '<b>Previous LocationID: </b>' + data.previousLocationID + '</td></tr><tr><th>MessageBody:</th><td>' + data.msg_body + '</td></tr><tr><th>Intent:</th><td>' + data.outcome.intent + '</td></tr><tr><th>Confidence:</th><td>' + data.outcome.confidence + '</td></tr></div></div>'

                        );

                    // Clean old ErrorMessages
                    $('#errorMessages')
                        .html();

                } else {
                    $('#logger')
                        .prepend(

                            '<div class="alert alert-danger" role="alert"><div class="table-responsive"><table class="logger"><tr><th><u>' + counter + '. Command</u></th><th>' + data.errMsg + '</th></tr><tr><td><b>Current LocationID: </b>' + data.locationID + '</td><td>' + '<b>Previous LocationID: </b>' + data.previousLocationID + '</td></tr><tr><th>MessageBody:</th><td>' + data.msg_body + '</td></tr><tr><th>Intent:</th><td>' + data.outcome.intent + '</td></tr><tr><th>Confidence:</th><td>' + data.outcome.confidence + '</td></tr></div></div>'

                        );

                    $('#errorMessages')
                        .html(
                            '<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>' + data.errMsg + '</strong></div>');
                }


                /* OLD VERSION IN Bsc-theses:

                // Preparing Logger
                var lengthMicrophoneInput = data.micStop - data.micStart;
                var lengthMicStopWitOnResult = data.witOnResult - data.micStop;
                var lengthMicStopWitOnResponse = data.witOnResponse - data.micStop;
                var lengthMicStopNeo4jOnResponse = data.neo4jOnResponse - data.micStop;
                var lengthMicStopFrontendRecieved = data.frontendRecieved - data.micStop;
                var lengthMicStartFrontendRecieved = data.frontendRecieved - data.micStart;

                var now = new Date(data.currTimestamp);

                // Preparing current timestamp when microphone was started
                var curr_date = now.getDate();
                var curr_month = now.getMonth();
                var curr_year = now.getFullYear();
                var curr_hours = now.getHours();
                var curr_minutes = now.getMinutes();
                var curr_seconds = now.getSeconds();

                if (curr_minutes < 10) {
                    curr_minutes = "0" + curr_minutes;
                }
                if (curr_seconds < 10) {
                    curr_seconds = "0" + curr_seconds;
                }
                var strTimestamp = curr_hours + ":" + curr_minutes + ":" + curr_seconds;


                if (data.success) {
                    var _status = '<td style="color:green; font-weight: bold;">' + data.success + "</td>";
                } else {
                    var _status = '<td style="color:red; font-weight: bold;">' + data.errMsg + "</td>";
                }


                $('#logger')
                            .append(

                        '<table class="table"><tr></tr><tr></tr>' +
                        "<tr><td><b>Timestamp</b></td><td>" + curr_year + '-' + curr_month + '-' + curr_date + ' ' + strTimestamp + "</td></tr>" + "<tr><td><b>MessageID</b></td><td>" + data.msg_id + "</td></tr>" + "<tr><td><b>MessageBody</b></td><td>" + data.msg_body + "</td></tr>" + '<tr><td><b>Intent</b></td><td style="color:blue; font-weight: bold;">' + data.outcome.intent + "</td></tr>" + "<tr><td><b>Confidence</b></td><td>" + data.outcome.confidence + "</td></tr>" + "<tr><td><b>Current LocationID</b></td><td>" + data.locationID + "</td></tr>" + "<tr><td><b>Previous LocationID </b></td><td>" + data.previousLocationID + "</td></tr>" + "<tr><td><b>Status</b></td>" + _status + "</tr>" + "<tr><td><b>Times</b></td><td>(1) " + lengthMicrophoneInput + "<br>(2) " + lengthMicStopWitOnResult + "<br>(3) " + lengthMicStopWitOnResponse + "<br>(4) " + lengthMicStopNeo4jOnResponse + "<br>(5) " + lengthMicStopFrontendRecieved + "<br>(6) " + lengthMicStartFrontendRecieved + "</td></tr>" + "</table><hr><br>"
                    );
                */
            });


            this.locations = new Locations();
            this.relatedLocations = new Locations();

            this.locations.fetch({
                success: function(model, repsonse, options) {
                    thiz.locationsListView = new LocationsListView({
                        model: thiz.locations,
                        el: $('#startLocationBody'),
                        remote: thiz
                    });

                    thiz.relatedLocationsListView = new LocationsListView({
                        model: thiz.relatedLocations,
                        el: $('#relatedLocationsBody'),
                        remote: thiz
                    });
                },
                error: function(model, repsonse, options) {
                    JL('iPED Toolkit.Remote')
                        .error(repsonse);
                }
            });

            // By relouding the Remote Control App or Initialising check if micPermission in Frontend was already set
            this.askForMicPermission();
        }

        /**
         * Emits the socket.io command to load the specified location and fetches corresponding related locations
         * @param locationId - The ID of the location to load
         */
        Remote.prototype.setLocationId = function(locationId) {
            JL('iPED Toolkit.Remote')
                .debug('Set location ID to: ' + locationId);

            this.socket.emit('setLocationId', locationId);
            this.fetchRelatedLocations(locationId);
        };

        /**
         * Fetches and displays all related locations to the given location ID
         * @param locationId - The ID of the location to fetch related locations for
         */
        Remote.prototype.fetchRelatedLocations = function(locationId) {
            var thiz = this;

            JL('iPED Toolkit.Remote')
                .debug('Fetch related locations for ID: ' + locationId);

            this.relatedLocations.url = '/api/locations/' + locationId + '/locations';
            this.relatedLocations.fetch({
                success: function(model, repsonse, options) {
                    if ($('#relatedLocations')
                        .hasClass('in') == false) {
                        $('a[href="#relatedLocations"]')
                            .click();
                    }
                },
                error: function(model, repsonse, options) {
                    JL('iPED Toolkit.Remote')
                        .error(repsonse);
                }
            });
        };

        /**
         * Activates/Deactivates over Websockets for Frontend with real Microphone access over Google Chromes RTC
         * @param status - Boolean (true) for activating the Microphone over RTC
         */
        Remote.prototype.activateMicrophone = function(language) {

            this.socket.emit('activateMic', language);
        };

        /**
         * [listen description]
         * @return {[type]} [description]
         */
        Remote.prototype.listen = function() {

            if (this.micstatus == 0) {

                this.micstatus = 1;
                JL('iPED Toolkit.Remote')
                    .debug('Listen: ' + this.micstatus);
                $('.mic-icon')
                    .css('border-color', 'red');
                this.micStart = new Date()
                    .getTime();
                this.socket.emit('listen', this.micstatus);

            } else {

                var micEnd = new Date()
                    .getTime();

                // Wait for delay in Frontend: setTimeout(500, because of sound playing, when activating mic and recording, so that no overlapping occurs)
                if (this.micstatus == 1 && micEnd - this.micStart < 500) {
                    //console.log("Wait for delay in Frontend");
                } else {

                    this.micstatus = 0;
                    JL('iPED Toolkit.Remote')
                        .debug('Stop listening ' + this.micstatus);
                    $('.mic-icon')
                        .css('border-color', 'black');
                    this.socket.emit('listen', this.micstatus);
                }
            }
        };

        /*
            Check Frontend if micPersmission was already setup with a language
         */
        Remote.prototype.askForMicPermission = function() {
            var data = null;
            this.socket.emit('getFrontendMicPermission', function(data) {
                JL('iPED Toolkit.Remote - getFrontendMicPermission:')
                    .debug(data);
            });
        }

        $(document)
            .ready(function() {
                var remote = new Remote();

                var collapsed = false;

                /**
                 * Voice Control: Select a language before you can connect to Wit.Ai
                 * It activates the microphone in the Browser, after user accept the permission in Frontend
                 */
                $('#language')
                    .click(function() {

                        if ($("input[name='languages']:checked")
                            .length === 0) {
                            alert("Bitte zuerst eine Sprache wählen und dann im Frontend das Mikrofon freigeben! \n\n" +
                                "Falls Sie Probleme haben, probieren Sie einen Neustart des Frontends, sowie der Remote Control App!");
                        } else {
                            var lang = $("input[name='languages']:checked")
                                .val();
                            JL('iPED Toolkit.Remote')
                                .debug('Activate microphone using language: ' + lang);

                            // setup Microphone and access to Wit.Ai with selected Language in Frontend
                            remote.activateMicrophone(lang);
                        }
                    });

                /**
                 * Voice Control: Start and stop recording by using the microphone button
                 * Frontend will be listening, if you have permission to the microphone in the Frontend
                 * and you have setup a connection to Wit.Ai with a selected language
                 * It is not possible at the moment to switch from an language to another, whitout restarting the Frontend
                 * and Remote Control App. It depends on the connection to Wit.Ai
                 */
                $('#microphone')
                    .click(function() {

                        JL('iPED Toolkit.Remote')
                            .debug("remoteMicPermission: " + micPermission);

                        if (micPermission == 1) {
                            remote.listen();
                        } else {
                            alert("Bitte geben Sie erst im Frontend das Mikrofon frei! \n\n" +
                                "Falls Sie Probleme haben, probieren Sie einen Neustart des Frontends, sowie der Remote Control App!");
                        }
                    });

                /**
                 * Hide Header if Voice Control is in use
                 */
                $('#voiceControlTitle')
                    .click(function() {

                        if (!collapsed) {
                            $('#remoteControlTitle')
                                .hide();
                            collapsed = true;
                        } else {
                            $('#remoteControlTitle')
                                .show();
                            collapsed = false;
                        }
                    });

            });

    }
);
