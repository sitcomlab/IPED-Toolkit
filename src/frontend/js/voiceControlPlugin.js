/*!
 * The IPED Toolkit
 * VoiceControl plugin
 *
 * (c) 2015 Nicholas Schiestel, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['jsnlog/js/jsnlog.min',
        'jquery/js/jquery.min',
        'underscorejs/js/underscore',
        'socketio/js/socket.io',
        'ionsound/js/ion.sound',
        'microphone/microphone'
    ],

    function(JSNLog, JQuery, Underscore, Socketio, IonSound, Microphone) {
        function VoiceControlPlugin(opts) {
            JL('IPED Toolkit.VoiceControlPlugin')
                .info('VoiceControlPlugin loaded');

            this.parent = opts.parent;
            this.socket = opts.parent.socket;
            this.mic = null;
            this.micPermission = null;
            this.language = null;

            // Load files for Voice Control Sounds
            ion.sound({
                sounds: [{
                    name: 'mic_start'
                }, {
                    name: 'mic_stop'
                }, {
                    name: 'voice_command_failed'
                }],
                volume: 1.0,
                path: 'sounds/',
                preload: true
            });
        }

        VoiceControlPlugin.prototype.setLocationId = function(locationId) {
            // Save previous and current LocationID global for Voice Control
            if (previousLocation === null && currentLocation === null) {
                currentLocation = locationId;
            } else {
                previousLocation = currentLocation;
                currentLocation = locationId;
            }
        };

        VoiceControlPlugin.prototype.initialize = function() {
            var thiz = this;
            this.mic = new Wit.Microphone();
            this.mic.onready = function() {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .info('Microphone is ready to record');

                thiz.micPermission = 1;
                JL('IPED Toolkit.VoiceControlPlugin')
                    .info('setRemoteMicPermission to ' + thiz.micPermission);
                thiz.socket.emit('[VoiceControl]setRemoteMicPermission', thiz.micPermission);
            };
            this.mic.onaudiostart = function() {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .debug('Recording started');
            };
            this.mic.onaudioend = function() {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .debug('Recording stopped, processing started');
            };
            this.mic.onresult = function(intent, entities, res) {

                // add LocationID for Neo4J checking
                if (currentLocation === null) {
                    res.locationID = null;
                } else {
                    res.locationID = currentLocation;
                    res.previousLocationID = previousLocation;
                }

                thiz.socket.emit('witResponse', res);
            };
            this.mic.onerror = function(err) {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .error(err);
            };
            this.mic.onconnecting = function() {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .debug('Microphone is connecting');
            };
            this.mic.ondisconnected = function() {
                JL('IPED Toolkit.VoiceControlPlugin')
                    .debug('Microphone is not connected');
            };

            //Set MicPermission for Remote Control App
            this.socket.on('[VoiceControl]getMicPermission', function(data) {
                thiz.socket.emit('[VoiceControl]setRemoteMicPermission', thiz.micPermission);
                JL('IPED Toolkit.VoiceControlPlugin')
                    .debug('setRemoteMicPermission to' + thiz.micPermission);
            });

            // Set selected language for Remote Control App
            this.socket.on('[VoiceControl]getSelectedLanguage', function(data) {
                thiz.socket.emit('[VoiceControl]setSeletedLanguage', language);
                JL('IPED Toolkit.VoiceControl')
                    .debug('setSeletedLanguage to ' + thiz.language);
            });

            // Setup Microphone with selected language and its corresponing Wit.Ai instance (CLIENT_ACCESS_TOKEN)
            this.socket.on('[VoiceControl]setupMic', function(data) {
                thiz.language = data;

                var CLIENT_ACCESS_TOKEN;
                if (data == 'en') {
                    CLIENT_ACCESS_TOKEN = 'LPRCS56RLGDT5UKWR7VDLW5JJRGIOOI5';
                } else if ('de') {
                    // DEVELOPER VERSION
                    //CLIENT_ACCESS_TOKEN = 'ABD6CEWUD3YR3G2Y4SYP7JI4FSVQ2WDI';
                    // DEVELOPER VERSION LUCIEN
                    CLIENT_ACCESS_TOKEN = 'YNYUGOKUDD2BTQ2473IDGF4YYVVFIHCX';
                }

                if (CLIENT_ACCESS_TOKEN !== null || CLIENT_ACCESS_TOKEN !== undefined) {
                    thiz.mic.connect(CLIENT_ACCESS_TOKEN);
                } else {
                    JL('IPED Toolkit.VoiceControl')
                        .error('Could not access Wit.Ai!');
                }
            });

            // Start or Stop recording with the microphone, depends on the users input in the remote control app
            this.socket.on('[VoiceControl]listenMic', function(data) {
                if (data == 1) {
                    JL('IPED Toolkit.VoiceControl')
                        .debug('Activate Microphone and start recording');

                    // Play activating sound for user
                    ion.sound.play('mic_start');

                    // Turn the volume of the current video down, because of better voice recording
                    $('#IPED-Video')[0].volume = 0.1;

                    // Start microphone recording with a delay, because of playing the activating sound
                    var delay = setTimeout(function() {
                        thiz.mic.start();
                    }, 460);
                } else if (data === 0) {
                    JL('IPED Toolkit.VoiceControl')
                        .debug('Deactivate Microphone and stop recording');

                    // Play deactivating sound for user
                    ion.sound.play('mic_stop');

                    // Stop microphone recording
                    thiz.mic.stop();

                    // Turn the volume of the current video down, because of better voice recording
                    $('#IPED-Video')[0].volume = 1.0;
                } else {
                    JL('IPED Toolkit.VoiceControl')
                        .error('Something went wrong in the Remote Control App!');
                }
            });

            // Inform user, if system failed, e.g. nothing found in Database or if an empty user input occors
            this.socket.on('[VoiceControl]failed', function(data) {
                JL('IPED Toolkit.VoiceControl')
                    .error('Voice command failed: ' + data);

                // Play failure sound for user
                ion.sound.play('voice_command_failed');
            });
        };

        return VoiceControlPlugin;
    }
);
