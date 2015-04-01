/*!
 * The iPED Toolkit
 * Frontend
 *
 * (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
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
        'frontend/chromaKeyPlugin'
    ],

    function(JSNLog, JQuery, io, getUrlParameters, Underscore, Backbone,
        Location, Locations, Video, Videos,
        OverlayPlugin, ChromaKeyPlugin) {
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
        }

        /**
         * Activates the web sockets that are used by the remote control.
         */
        Frontend.prototype.activateWebSockets = function() {
            var thiz = this;
            this.socket = io();
            this.socket.on('setLocationId', function(data) {
                JL('iPED Toolkit.Frontend')
                    .debug(data);
                thiz.setLocationId(data);
            });
            JL('iPED Toolkit.Frontend')
                .debug('Web sockets activated');
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

                    if (thiz.videos.length == 0) {
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
            });
    }
);
