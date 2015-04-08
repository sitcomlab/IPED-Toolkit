/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 *
 * Voice control
 * (c) 2015 Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

require.config(requireConfig);

var TPL_PATH = 'requirejs/js/text!../backend/templates/';
var CONTEXTMENU_WIDTH = 300;

require(['jsnlog/js/jsnlog.min',
        'jquery/js/jquery.min',
        'jquery/js/jquery-ui.min',
        'bootstrap/js/bootstrap.min',
        'bootstrap/js/bootstrap-tagsinput.min',
        'underscorejs/js/underscore',
        'backbonejs/js/backbone',
        'leaflet/js/leaflet',
        'leaflet/js/leaflet.contextmenu',
        'form2js/js/form2js',
        // Models
        'backend/models/Location',
        'backend/models/Locations',
        'backend/models/Video',
        'backend/models/Videos',
        'backend/models/Overlay',
        'backend/models/Overlays',
        // Views
        'backend/views/AboutView',
        'backend/views/MapView',
        'backend/views/MarkerView',
        'backend/views/LocationMarkerView',
        'backend/views/LocationEditView',
        'backend/views/OverlayEditView'
    ],

    function(JSNLog, JQuery, JQueryUI, Bootstrap, BootstrapTagsinput, Underscore, Backbone, Leaflet, LeafletContextmenu, form2js,
        Location, Locations, Video, Videos, Overlay, Overlays,
        AboutView, MapView, MarkerView, LocationMarkerView, LocationEditView, OverlayEditView) {

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
             JL('iPED Toolkit.Backend').fatal('Something very bad happened!');
             */
        })();

        /**
         * The backend of the iPED Toolkit.
         * @constructor
         */
        function Backend() {
            var thiz = this;
            _.bindAll(this, 'addLocation');

            this.mapView = null;

            this.locations = null;
            this.videos = null;
            this.overlays = null;

            this.createRouteFromLocation = null;
            this.createRouteFromMarker = null;
            this.createRouteToLocation = null;
            this.createRouteToMarker = null;
            this.locationEditViews = [];

            this.fetchLocations({
                callback: function() {
                    thiz.initMap();
                }
            });

            $('a.about')
                .on('click', function() {
                    var aboutView = new AboutView();
                    thiz.showAboutDialog({
                        content: aboutView.el
                    });
                });
        };

        /**
         * Initializes the leaflet map
         */
        Backend.prototype.initMap = function() {
            JL('iPED Toolkit.Backend')
                .debug('Init map with locations: ' + JSON.stringify(this.locations));
            this.mapView = new MapView({
                backend: this,
                model: this.locations
            });
        };

        /**
         * Fetches all locations from the server and prepares them for use in the backend
         */
        Backend.prototype.fetchLocations = function(opts) {
            var thiz = this;

            if (this.locations == null) {
                this.locations = new Locations();
            }
            this.locations.fetch({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Done fetching locations');
                    if (opts && opts.callback) {
                        opts.callback(opts.params);
                    }

                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(respone);
                }
            });
        };

        /**
         * Fetches all videos from the server and prepares them for use in the backend
         */
        Backend.prototype.fetchVideos = function(opts) {
            var thiz = this;

            if (this.videos == null) {
                this.videos = new Videos();
            }
            this.videos.fetch({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Done fetching videos');
                    if (opts && opts.callback) {
                        opts.callback(opts.params);
                    }
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(respone);
                }
            });
        };

        /**
         * Fetches all overlays from the server and prepares them for use in the backend
         */
        Backend.prototype.fetchOverlays = function(opts) {
            var thiz = this;

            if (this.overlays == null) {
                this.overlays = new Overlays();
            }
            this.overlays.fetch({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Done fetching overlays');
                    if (opts && opts.callback) {
                        opts.callback(opts.params);
                    }
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(respone);
                }
            });
        };

        /**
         * Add a new location, either a new one (location == null) or to an existing location (location != null)
         * @param location - Either null (add new location) or existing location
         */
        Backend.prototype.addLocation = function(opts) {
            if (opts.location instanceof Backbone.Model) {
                JL('iPED Toolkit.Backend')
                    .debug('Add new location to existing location: ' + JSON.stringify(opts.location));
                this.mapView.map.closePopup();
                var newLocation = opts.location.clone();
                newLocation.unset('id');
                var locationEditView = new LocationEditView({
                    backend: this,
                    title: 'Add state',
                    model: newLocation
                });
                this.locationEditViews.push(locationEditView);
                this.showEditLocationDialog({
                    content: locationEditView.el
                });
            } else {
                JL('iPED Toolkit.Backend')
                    .debug('Add new location: ' + JSON.stringify(opts));
                var newLocation = new Location();
                newLocation.set('lat', opts.latlng.lat);
                newLocation.set('lon', opts.latlng.lng);
                var locationEditView = new LocationEditView({
                    backend: this,
                    title: 'Add new location',
                    model: newLocation
                });
                this.locationEditViews.push(locationEditView);
                this.showEditLocationDialog({
                    content: locationEditView.el
                });
            }
        };

        /**
         * Edit an existing location
         * @param location - The location to be edited
         */
        Backend.prototype.editLocation = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('Edit location: ' + JSON.stringify(opts.location));
            this.mapView.map.closePopup();
            var locationEditView = new LocationEditView({
                backend: this,
                title: 'Edit location',
                model: opts.location
            });
            this.locationEditViews.push(locationEditView);
            this.showEditLocationDialog({
                content: locationEditView.el
            });
        };

        /**
         * Save a location by pushing it the the server
         * @param location - The location to be saved
         * @param attributes - The set of (changed) attributes
         */
        Backend.prototype.saveLocation = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('About to save location: ' + JSON.stringify(opts.location) + ', with new attributes: ' + JSON.stringify(opts.attributes));
            var thiz = this;

            opts.location.save(opts.attributes, {
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Location saved');
                    opts.dialog._close();
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                },
                error: function(model, response, options) {
                    opts.dialog._enableButtons();
                    JL('iPED Toolkit.Backend')
                        .error(response);
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                }
            });
        };

        /**
         * Delete a location
         * @param location - The location to be deleted
         */
        Backend.prototype.deleteLocation = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('About to delete location: ' + JSON.stringify(opts.location));
            var thiz = this;

            opts.location.destroy({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Location deleted');
                    thiz.mapView.map.closePopup();
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(response);
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                }
            })
        };

        /**
         * Opens a new view/frame that lets the user position a new overlay on top the video
         */
        Backend.prototype.addOverlay = function(opts) {
            var thiz = this;

            JL('iPED Toolkit.Backend')
                .debug('Add new overlay');
            var newOverlay = new Overlay({
                name: '',
                description: '',
                tags: [],
                type: 'image',
                //url: window.location.origin + window.location.pathname + 'images/testimage.jpg',
                url: window.location.origin + '/media/image/',
                w: 150,
                h: 150,
                x: 100,
                y: 0,
                z: 0,
                d: 1,
                rx: 0,
                ry: 0,
                rz: 0,
                sx: 1,
                sy: 1,
                sz: 1

            });
            var overlayEditView = new OverlayEditView({
                backend: this,
                title: 'Add overlay',
                model: {
                    video: opts.video,
                    overlay: newOverlay
                }
            });
            this.showEditOverlayDialog({
                content: overlayEditView.el
            });
        };

        /**
         * Edit an existing overlay
         * @param video - The video behind the overlay
         * @param overlay - The overlay to be edited
         */
        Backend.prototype.editOverlay = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('Edit overlay: ' + JSON.stringify(opts.overlay));
            var overlayEditView = new OverlayEditView({
                backend: this,
                title: 'Edit overlay',
                model: {
                    video: opts.video,
                    overlay: opts.overlay
                }
            });
            this.showEditOverlayDialog({
                content: overlayEditView.el
            });
        };

        /**
         * Saves overlay created by addOverlay to the database
         */
        Backend.prototype.saveOverlay = function(opts) {
            var thiz = this;

            JL('iPED Toolkit.Backend')
                .debug('About to save overlay: ' + JSON.stringify(opts.overlay) + ', with new attributes: ' + JSON.stringify(opts.attributes));
            opts.overlay.save(opts.attributes, {
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Overlay saved');
                    opts.dialog._close();
                    thiz.locationEditViews.forEach(function(locationEditView) {
                        locationEditView.update();
                    });
                },
                error: function(model, response, options) {
                    opts.dialog._enableButtons();
                    JL('iPED Toolkit.Backend')
                        .error(response);
                }
            });
        };

        /**
         * Delete an overlay
         * @param overlay - The overlay to be deleted
         */
        Backend.prototype.deleteOverlay = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('About to delete overlay: ' + JSON.stringify(opts.overlay));
            var thiz = this;

            opts.overlay.destroy({
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Overlay deleted');
                    thiz.locationEditViews.forEach(function(locationEditView) {
                        locationEditView.update();
                    });
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(response);
                }
            })
        };

        /**
         * Shows a customized JQuery dialog to add/edit locations
         */
        Backend.prototype.showEditLocationDialog = function(opts) {
            $(opts.content)
                .dialog({
                    dialogClass: 'ui-dialog-titlebar-hidden overflow-y',
                    height: 600,
                    draggable: false,
                    position: {
                        my: 'right-20 top+20',
                        at: 'right top',
                        of: $('.container')[0]
                    }
                })
                .dialog('open')
                .parent()
                .draggable();
        };

        /**
         * Shows a customized JQuery dialog to add/edit locations
         */
        Backend.prototype.showEditOverlayDialog = function(opts) {
            $(opts.content)
                .dialog({
                    dialogClass: 'ui-dialog-titlebar-hidden overflow-hidden',
                    width: '90%',
                    resizable: false,
                    draggable: false,
                    position: {
                        my: 'top+20',
                        at: 'top',
                        of: $('.container')[0]
                    }
                })
                .dialog('open')
                .parent()
                .draggable();
        };

        /**
         * Shows the about dialog with additional information
         */
        Backend.prototype.showAboutDialog = function(opts) {
            $(opts.content)
                .dialog({
                    dialogClass: 'ui-dialog-titlebar-hidden overflow-hidden',
                    width: '500px',
                    draggable: false,
                    position: {
                        my: 'center',
                        at: 'center',
                        of: $('.container')[0]
                    }
                })
                .dialog('open')
                .parent()
                .draggable();
        };

        /**
         * Defines the start location for creating a route
         * @param location - The location to start at
         * @param marker - The corresponding leaflet marker
         */
        Backend.prototype.createRouteFrom = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('Route from: ' + JSON.stringify(opts.location));

            if (this.createRouteFromMarker) {
                this.createRouteFromMarker.setIcon(this.createRouteFromMarker.markerView.normalMarkerIcon);
            }
            this.createRouteFromLocation = opts.location;
            this.createRouteFromMarker = opts.marker;
            this.createRouteFromMarker.setIcon(this.createRouteFromMarker.markerView.createRouteFromMarkerIcon);
        };

        /**
         * Defines the end location for creating a route
         * @param location - The location to end at
         * @param marker - The corresponding leaflet marker
         */
        Backend.prototype.createRouteTo = function(opts) {
            JL('iPED Toolkit.Backend')
                .debug('Route to: ' + JSON.stringify(opts.location));

            if (this.createRouteToMarker) {
                this.createRouteToMarker.setIcon(this.createRouteToMarker.markerView.normalMarkerIcon);
            }
            this.createRouteToLocation = opts.location;
            this.createRouteToMarker = opts.marker;
            this.createRouteToMarker.setIcon(this.createRouteToMarker.markerView.createRouteToMarkerIcon);

            this.saveRoute();
        };

        /**
         * Saves a new route by pusing it to the server
         */
        Backend.prototype.saveRoute = function(opts) {
            var thiz = this;

            // Morin: Important note about Backbone.js, arrays, and events: http://stackoverflow.com/questions/9909799/backbone-js-change-not-firing-on-model-change
            var relatedLocations = _.clone(this.createRouteFromLocation.get('relatedLocations'));
            if (_.indexOf(relatedLocations, this.createRouteToLocation.get('id')) != -1) {
                JL('iPED Toolkit.Backend')
                    .debug('Route already exists: ' + JSON.stringify(this.createRouteFromLocation) + ' -> ' + JSON.stringify(this.createRouteToLocation));

                thiz.fetchLocations({
                    //callback: thiz.mapView.render
                });
                return;
            }

            JL('iPED Toolkit.Backend')
                .debug('About to save route: ' + JSON.stringify(this.createRouteFromLocation) + ' -> ' + JSON.stringify(this.createRouteToLocation));

            relatedLocations.push(this.createRouteToLocation.get('id'));
            this.createRouteFromLocation.save({
                relatedLocations: relatedLocations
            }, {
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Route saved');
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(response);
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                }
            });
        };

        /**
         * Deletes a route
         */
        Backend.prototype.deleteRoute = function(opts) {
            var thiz = this;

            JL('iPED Toolkit.Backend')
                .debug('About to delete route: ' + JSON.stringify(opts.fromLocation) + ' -> ' + JSON.stringify(opts.toLocation));

            var relatedLocations = _.without(opts.fromLocation.get('relatedLocations'), opts.toLocation.get('id'));
            opts.fromLocation.save({
                relatedLocations: relatedLocations
            }, {
                success: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .debug('Route deleted');
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                },
                error: function(model, response, options) {
                    JL('iPED Toolkit.Backend')
                        .error(response);
                    thiz.fetchLocations({
                        //callback: thiz.mapView.render
                    });
                }
            })

        };

        /**
         * Converts form data into a JSON object
         * (Basically uses form2js.js and applies special number treatment.)
         * (Morin's notes: /"[^{},:]*"/g)
         */
        Backend.prototype.form2js = function(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName) {
            var json = JSON.stringify(form2js(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName));
            json = json.replace(/"[-0-9]*"/g, function(match, capture) {
                return parseInt(match.replace(/"/g, ''), 10);
            });
            json = json.replace('null', '');
            return JSON.parse(json);
        };

        $(document)
            .ready(function() {
                var backend = new Backend();
            });
    }
);
