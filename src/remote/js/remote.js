/*!
 * The iPED Toolkit
 * Remote
 *
 * (c) 2014 Morin Ostkamp
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
        'remote/views/LocationsListView'
    ],

    function(JSNLog, JQuery, io, Underscore, Backbone, Bootstrap,
        Location, Locations, Video, Videos,
        LocationsListView) {
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
         * The remote of the iPED Toolkit.
         * @constructor
         */
        function Remote() {
            var thiz = this;

            _.bindAll(this, 'setLocationId', 'fetchRelatedLocations');

            this.socket = io();

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

        $(document)
            .ready(function() {
                var remote = new Remote();
            });
    }
);
