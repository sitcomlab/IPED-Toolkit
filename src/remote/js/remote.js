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
        'bootstrap-switch/dist/js/bootstrap-switch.min',

        // Models
        'backend/models/Location',
        'backend/models/Locations',
        'backend/models/Video',
        'backend/models/Videos',

        // Views
        'remote/views/LocationsListView',

    ],

    function(JSNLog, JQuery, io, Underscore, Backbone, Bootstrap, Switch, Location, Locations, Video, Videos, LocationsListView) {
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
         * Global variable for LoggerID
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

            // variable for show/hide Overlays
            var overlayStatus = true;

            // variable for show/hide Overlays
            var voiceControlStatus = false;

            // variables for voice control
            this.micstatus = 0;


            _.bindAll(this, 'setLocationId', 'fetchRelatedLocations');

            this.socket = io();



            this.socket.on('changeShowHideOverlays', function(data) {
                overlayStatus = data;
                JL('iPED Toolkit.Remote - showHideOverlays')
                    .debug(data);
            });



            this.socket.on('setMicPermission', function(data) {
                micPermission = data;
                JL('iPED Toolkit.Remote - setMicPermission')
                    .debug(data);

                if (micPermission == 1) {
                    $('#language')
                        .removeClass("btn-primary");
                    $('#language')
                        .addClass("btn-success");
                    $('#language')
                        .attr("disabled", true);
                    $('#voiceControlPanel')
                        .removeClass("panel-primary");
                    $('#voiceControlPanel')
                        .addClass("panel-success");
                    $('#voiceControlTitle')
                        .html("Voice Control (ready to use)");
                } else {
                    $('#language')
                        .removeClass("btn-success");
                    $('#language')
                        .addClass("btn-primary");
                    $('#language')
                        .attr("disabled", false);
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
                if (language !== null) {
                    $('input[name="languages"][value=' + language + ']')
                        .prop('checked', true);
                }
            });



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
                    $('#alert')
                        .alert('close');

                } else {
                    $('#logger')
                        .prepend(

                            '<div class="alert alert-danger" role="alert"><div class="table-responsive"><table class="logger"><tr><th><u>' + counter + '. Command</u></th><th>' + data.errMsg + '</th></tr><tr><td><b>Current LocationID: </b>' + data.locationID + '</td><td>' + '<b>Previous LocationID: </b>' + data.previousLocationID + '</td></tr><tr><th>MessageBody:</th><td>' + data.msg_body + '</td></tr><tr><th>Intent:</th><td>' + data.outcome.intent + '</td></tr><tr><th>Confidence:</th><td>' + data.outcome.confidence + '</td></tr></div></div>'

                        );

                    $('#errorMessages')
                        .html(
                            '<div id="alert" class="alert alert-danger alert-dismissible fade" role="alert"></div>');

                    $('#alert')
                        .addClass('in');
                    $('#alert')
                        .html(
                            '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>' + data.errMsg + '</strong>'
                        );
                }
            });

            // Show/Hide Overalys by voice command
            this.socket.on('changeShowHideOverlays', function(data) {
                JL('iPED Toolkit.Remote - changeShowHideOverlays')
                    .debug(data);
                if (data === true) {
                    this.overlayStatus = true;
                    $("#switchOverlay")
                        .bootstrapSwitch('state', true, true);
                } else  {
                    this.overlayStatus = false;
                    $("#switchOverlay")
                        .bootstrapSwitch('state', false, false);
                }
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
                        .hasClass('in') === false) {
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

            if (this.micstatus === 0) {

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

                // Hide Error-Message
                if ($("#alert")
                    .length > 0) {
                    $('#alert')
                        .alert('close');
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
        };


        /*
            Show/Hide Overlays in Frontend
         */
        Remote.prototype.showHideOverlays = function() {
            this.socket.emit('showHideOverlays', this.overlayStatus);
            JL('iPED Toolkit.Remote - showHideOverlays:')
                .debug(this.overlayStatus);
        };


        /**
         * THE FOLLOWING PROTOTYPES BELONG TO MIA
         **/
        Remote.prototype.showAvatar = function() {
            this.socket.emit('show_avatar', null);
            JL('iPED Toolkit.Remote - show_avatar:')
                .debug();
        };

        Remote.prototype.hideAvatar = function() {
            this.socket.emit('hide_avatar', null);
            JL('iPED Toolkit.Remote - hide_avatar:')
                .debug();
        };

        Remote.prototype.moveUp = function() {
            this.socket.emit('move_up', null);
            JL('iPED Toolkit.Remote - move_up:')
                .debug();
        };

        Remote.prototype.moveDown = function() {
            this.socket.emit('move_down', null);
            JL('iPED Toolkit.Remote - move_down:')
                .debug();
        };

        Remote.prototype.moveLeft = function() {
            this.socket.emit('move_left', null);
            JL('iPED Toolkit.Remote - move_left:')
                .debug();
        };

        Remote.prototype.moveRight = function() {
            this.socket.emit('move_right', null);
            JL('iPED Toolkit.Remote - move_right:')
                .debug();
        };

        Remote.prototype.scaleUp = function() {
            this.socket.emit('scale_up', null);
            JL('iPED Toolkit.Remote - scale_up:')
                .debug();
        };

        Remote.prototype.scaleDown = function() {
            this.socket.emit('scale_down', null);
            JL('iPED Toolkit.Remote - scale_down:')
                .debug();
        };

        // DOCUMENT-READAY
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
                 * Show/Hide Overlays
                 */
                if (remote.overlayStatus === true) {
                    $("#switchOverlay")
                        .bootstrapSwitch()
                        .state = true;
                }

                $("#switchOverlay")
                    .bootstrapSwitch()
                    .on('switchChange.bootstrapSwitch', function(event, state) {

                        if (state === true) {
                            remote.overlayStatus = true;
                            remote.showHideOverlays();
                        } else {
                            remote.overlayStatus = false;
                            remote.showHideOverlays();
                        }
                    });


                /**
                 * Show/Hide Setup-Panel & Logger-Panel of Voice-Control-System
                 */
                if (remote.voiceControlStatus === true) {
                    $("#switchVoiceControl")
                        .bootstrapSwitch()
                        .state = true;
                    $("#mainVoiceControlPanel")
                        .show();
                    $("#loggerPanel")
                        .show();
                } else {
                    $("#switchVoiceControl")
                        .bootstrapSwitch()
                        .state = false;
                    $("#mainVoiceControlPanel")
                        .hide();
                    $("#loggerPanel")
                        .hide();
                }

                $("#switchVoiceControl")
                    .bootstrapSwitch()
                    .on('switchChange.bootstrapSwitch', function(event, state) {

                        if (state === true) {
                            remote.voiceControlStatus = true;
                            $("#mainVoiceControlPanel")
                                .show();
                            $("#loggerPanel")
                                .show();

                            if (!collapsed) {
                                $('#remoteControlTitle')
                                    .hide();
                                collapsed = true;
                                $('#useVoiceControl')
                                    .collapse();
                            } else {
                                $('#remoteControlTitle')
                                    .show();
                                collapsed = false;
                                $('#useVoiceControl')
                                    .collapse();
                            }

                        } else {
                            remote.voiceControlStatus = false;
                            $("#mainVoiceControlPanel")
                                .hide();
                            $("#loggerPanel")
                                .hide();

                            if (!collapsed) {
                                $('#remoteControlTitle')
                                    .hide();
                                collapsed = true;
                                $('#useVoiceControl')
                                    .collapse();
                            } else {
                                $('#remoteControlTitle')
                                    .show();
                                collapsed = false;
                                $('#useVoiceControl')
                                    .collapse();
                            }
                        }
                    });

                // MIA
                $("#switchGestureControl")
                    .bootstrapSwitch()
                    .on('switchChange.bootstrapSwitch', function(event, state) {
                        if (state) {
                            $('#gestureCommands')
                                .show();
                        } else {
                            $('#gestureCommands')
                                .hide();
                        }
                    });

                // CLICK-EVENTS FOR BUTTONS
                $('#button_show')
                    .click(function() {
                        remote.showAvatar();
                    });

                $('#button_hide')
                    .click(function() {
                        remote.hideAvatar();
                    });

                $('#button_up')
                    .click(function() {
                        remote.moveUp();
                    });

                $('#button_down')
                    .click(function() {
                        remote.moveDown();
                    });

                $('#button_left')
                    .click(function() {
                        remote.moveLeft();
                    });

                $('#button_right')
                    .click(function() {
                        remote.moveRight();
                    });

                $('#button_scale_up')
                    .click(function() {
                        remote.scaleUp();
                    });

                $('#button_scale_down')
                    .click(function() {
                        remote.scaleDown();
                    });
            });

    }
);
