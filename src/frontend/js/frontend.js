/*!
 * The iPED Toolkit
 * Frontend
 *
 * (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 *
 * Voice control
 * (c) 2015 Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

require.config(requireConfig);

require(['jsnlog/js/jsnlog.min',
        'jquery/js/jquery.min',
        'socketio/js/socket.io',
        'utils/js/getUrlParameters',
        'underscorejs/js/underscore',
        'backbonejs/js/backbone',

        // Models
        'backend/models/Location',
        'backend/models/Locations',
        'backend/models/Video',
        'backend/models/Videos',

        // Additional iPED Toolkit Plugins, e.g., Overlays
        'frontend/overlayPlugin',
        'frontend/chromaKeyPlugin',

        // Additinal Plugins for Voice Control
        'microphone/microphone'

    ],

    function(JSNLog, JQuery, io, getUrlParameters, Underscore, Backbone,
        Location, Locations, Video, Videos,
        OverlayPlugin, ChromaKeyPlugin, Microphone) {
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
             JL('iPED Toolkit.Frontend').fatal('Something very bad happened!');
             */
        })();


        /**
         * Global variables for saving the current and previous LocationID for Voice Control Commands
         * and for logging the times
         */
        var currentLocation = null;
        var previousLocation = null;
        var micStart = null;
        var micStop = null;

        /**
         * Global variables for micPermission and language if Frontend or Remote Control App will be refreshed
         */
        var micPermission = null;
        var language = null;

        /**
         * The frontend of the iPED Toolkit.
         * @constructor
         */
        function Frontend() {

            this.location = null;
            this.socket = null;
            this.video = new Video;
            this.myHooks = [];
            this.myHooks['setLocationId'] = [];
            this.myHooks['onWindowResize'] = [];

            this.activateWebSockets();
            this.setLocationId(getURLParameters('locationId'));

            _.bindAll(this, 'onWindowResize');
            window.addEventListener('resize', this.onWindowResize);

            micPermission = 0;
            language = null;

            /**
             * Microphone Initialisation
             * from Wit.Ai WebSDK
             */
            this.mic = new Wit.Microphone();

            this.mic.onready = function() {
                console.info("Microphone is ready to record");

                this.socket = io();
                micPermission = 1;
                JL('iPED Toolkit.Frontend setRemoteMicPermission to')
                    .info(micPermission);
                this.socket.emit('setRemoteMicPermission', micPermission);

            };
            this.mic.onaudiostart = function() {
                console.info("Recording started");
            };
            this.mic.onaudioend = function() {
                console.info("Recording stopped, processing started");
            };
            this.mic.onresult = function(intent, entities, res) {

                // add LocationID for Neo4J checking
                if (currentLocation === null) {
                    res.locationID = null;
                } else {
                    res.locationID = currentLocation;
                    res.previousLocationID = previousLocation;
                }

                // add logging times
                res.micStart = micStart;
                res.micStop = micStop;

                this.socket = io();
                this.socket.emit('witResponse', res);
            };
            this.mic.onerror = function(err) {
                console.error("Error: " + err);
            };
            this.mic.onconnecting = function() {
                console.info("Microphone is connecting");
            };
            this.mic.ondisconnected = function() {
                console.info("Microphone is not connected");
            };

            function kv(k, v) {
                if (toString.call(v) !== "[object String]") {
                    v = JSON.stringify(v);
                }
                return k + "=" + v + "\n";
            }
        }


        /**
         * Activates the web sockets that are used by the remote control.
         */
        Frontend.prototype.activateWebSockets = function() {
            var thiz = this;
            this.socket = io();


            JL('iPED Toolkit.Frontend')
                .debug('Web sockets activated');
            this.micPermission = 0;
            this.socket.emit('resetFrontendMicPermission', this.micPermission);
            JL('iPED Toolkit.Frontend resetFrontendMicPermission to')
                .info(this.micPermission);


            /*
                Set new LocationID for changing a video
             */
            this.socket.on('setLocationId', function(data) {

                if (typeof data != "number") {
                    thiz.setLocationId(data.id);

                    socket.emit('beforeMainLogger', data);
                } else {
                    thiz.setLocationId(data);
                }

                JL('iPED Toolkit.Frontend')
                    .debug(data);

            });

            /*
                Set MicPermission for Remote Control App
             */
            this.socket.on('getMicPermission', function(data) {
                socket.emit('setRemoteMicPermission', micPermission);
                JL('iPED Toolkit.Frontend setRemoteMicPermission to')
                    .debug(micPermission);
            });

            /*
                Set selected language for Remote Control App
             */
            this.socket.on('getSelectedLanguage', function(data) {
                socket.emit('setSeletedLanguage', language);
                JL('iPED Toolkit.Frontend setSeletedLanguage to')
                    .debug(language);
            });


            /*
                Setup Microphone with selected language and its corresponing Wit.Ai instance (CLIENT_ACCESS_TOKEN)
             */
            this.socket.on('setupMic', function(data) {
                JL('iPED Toolkit.Frontend')
                    .debug(data);

                language = data;

                var CLIENT_ACCESS_TOKEN;
                if (data == 'en') {
                    CLIENT_ACCESS_TOKEN = "LPRCS56RLGDT5UKWR7VDLW5JJRGIOOI5";
                } else if ('de') {
                    // DEVELOPER VERSION
                    CLIENT_ACCESS_TOKEN = "ABD6CEWUD3YR3G2Y4SYP7JI4FSVQ2WDI";
                }

                if (CLIENT_ACCESS_TOKEN !== null || CLIENT_ACCESS_TOKEN !== undefined) {
                    thiz.mic.connect(CLIENT_ACCESS_TOKEN);

                } else {
                    alert("Could not access to Wit.Ai!");
                }

            });


            /*
                Start or Stop recording with the microphone, depends on the users input in the remote control app
             */
            this.socket.on('listenMic', function(data) {
                JL('iPED Toolkit.Frontend')
                    .debug(data);

                if (data == 1) {
                    JL('iPED Toolkit.Frontend')
                        .debug('activate Microphone and start recording');

                    // Play activating sound for user
                    ion.sound.play("mic_start");

                    // Turn the volume of the current video down, because of better voice recording
                    $('#iPED-Video')[0].volume = 0.1;

                    // Start microphone recording with a delay, because of playing the activating sound
                    var delay = setTimeout(function() {

                        thiz.mic.start();

                        // Logger
                        micStart = new Date()
                            .getTime();

                    }, 460);


                } else if (data === 0) {
                    JL('iPED Toolkit.Frontend')
                        .debug('deactivate Microphone and stop recording');

                    // Play deactivating sound for user
                    ion.sound.play("mic_stop");

                    // Stop microphone recording
                    thiz.mic.stop();

                    // Logger
                    micStop = new Date()
                        .getTime();

                    // Turn the volume of the current video down, because of better voice recording
                    $('#iPED-Video')[0].volume = 1.0;
                } else {
                    alert("Something went wrong in the Remote Control App!");
                }
            });

            /*
                Inform user, if system failed, e.g. nothing found in Database or if an empty user input occors
             */
            this.socket.on('failed', function(data) {
                JL('iPED Toolkit.Remote - Voice Command failed')
                    .error(data);

                // Play failure sound for user
                ion.sound.play("voice_command_failed");
            });



            /*
                Show/Hide Overlays from Remote or VoiceControl-Command
             */
            this.socket.on('setShowHideOverlays', function(data) {
                JL('iPED Toolkit.Remote - setShowHideOverlays')
                    .debug(data);

                if (!data) {
                    $('#iPED-Overlay')
                        .hide();
                } else {
                    $('#iPED-Overlay')
                        .show();
                }
            });


        };

        /**
         * Fetches the location matching locationId from the server and loads it
         * @param {Number} locationId - The ID of the requested location
         */
        Frontend.prototype.setLocationId = function(locationId) {

            var thiz = this;

            if (!locationId) {
                JL('iPED Toolkit.Frontend')
                    .error('Please sepcify "locationId", e.g., via URL parameter or websocket.');
                return;
            }

            $('.messages')
                .empty();


            // Save previous and current LocationID global for Voice Control
            if (previousLocation === null && currentLocation === null) {
                currentLocation = locationId;
            } else {
                previousLocation = currentLocation;
                currentLocation = locationId;
            }


            JL('iPED Toolkit.Frontend')
                .info('Set location ID to: ' + locationId);
            this.location = new Location({
                id: locationId
            });
            this.location.fetch({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Frontend')
                        .debug(thiz.location);
                    thiz.loadVideo();
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Frontend')
                        .error(respone);
                }
            });

            this.myHooks['setLocationId'].forEach(function(hook) {
                hook(locationId);
            }, this);
        };

        /**
         * Loads the video that belongs to the current location
         */
        Frontend.prototype.loadVideo = function() {
            var thiz = this;

            this.videos = new Videos();
            this.videos.url = '/api/locations/' + this.location.get('id') + '/videos';
            this.videos.fetch({
                success: function(model, response, options) {
                    // Remove current video
                    $('#iPED-Video')[0].pause();
                    $('#iPED-Video')
                        .empty();

                    if (thiz.videos.length === 0) {
                        JL('iPED Toolkit.Frontend')
                            .info('No video defined for this location');
                        thiz.showMessage('No video defined for this location');
                        return;
                    }

                    thiz.video = thiz.videos.at(0);
                    JL('iPED Toolkit.Frontend')
                        .debug('Loading video id ' + thiz.video.get('id') + ' for current location');

                    // Fill video tag with the new source
                    $('#iPED-Video')
                        .append('<source id ="video_source_mp4" src="' + thiz.video.get('url') + '.mp4" type="video/mp4" />');
                    $('#iPED-Video')
                        .append('<source id ="video_source_ogv" src="' + thiz.video.get('url') + '.ogg" type="video/ogg" />');
                    $('#iPED-Video')[0].load();
                    $('#iPED-Video')[0].play();
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Frontend')
                        .error(respone);
                }
            });
        };

        /*
         * Update/refresh views when window resizes
         */
        Frontend.prototype.onWindowResize = function() {
            this.myHooks['onWindowResize'].forEach(function(hook) {
                hook($(window)
                    .width(), $(window)
                    .height());
            }, this);
        };

        /**
         * Shows messages in a dedicated div container
         * @param message - The message as a string
         */
        Frontend.prototype.showMessage = function(message) {
            $('.messages')
                .html($('.messages')
                    .html() + '<h3>' + message + '</h3>');
        };

        $(document)
            .ready(function() {
                var frontend = new Frontend();
                var overlayPlugin = new OverlayPlugin({
                    parent: frontend
                });
                var chromaKeyPlugin = new ChromaKeyPlugin({
                    parent: overlayPlugin
                });

                // Load files for Voice Control Sounds
                ion.sound({
                    sounds: [{
                        name: "mic_start"
                    }, {
                        name: "mic_stop"
                    }, {
                        name: "voice_command_failed"
                    }],
                    volume: 1.0,
                    path: "sounds/",
                    preload: true
                });
            });
    }
);
