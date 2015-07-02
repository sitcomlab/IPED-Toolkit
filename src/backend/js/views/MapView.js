/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'leaflet/js/leaflet',
        'backend/models/Locations',
        'backend/views/MarkerView',
        'backend/views/RouteView'
    ],
    function(Backbone, Leaflet, Locations, MarkerView, RouteView) {
        /**
         * The Backbone.js view for a leaflet map
         */
        MapView = Backbone.View.extend({
            id: 'map',
            initialize: function(opts) {
                var thiz = this;

                _.bindAll(this, 'render', 'renderMarkers', 'renderRoutes');

                this.backend = opts.backend;

                var options = {
                    contextmenu: true,
                    contextmenuWidth: CONTEXTMENU_WIDTH,
                    contextmenuItems: [{
                        index: 0,
                        text: '<span class="glyphicon glyphicon-plus"></span> Add new location',
                        callback: this.backend.addLocation
                    }]
                };
                var muenster = [51.962655, 7.625763];
                var zoom = 15;

                this.map = L.map(this.$el.attr('id'), options)
                    .setView(muenster, zoom);
                //'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                        maxZoom: 18
                    })
                    .addTo(this.map);

                this.markersFeatureGroup = L.featureGroup()
                    .addTo(this.map);
                this.routesFeatureGroup = L.featureGroup()
                    .addTo(this.map);

                this.map.on('contextmenu', function(e) {
                    this.coords = e.latlng;
                    JL('iPED Toolkit.Backend')
                        .debug('Click on map (' + this.coords + ')');
                });

                this.map.on('popupopen', function(event) {
                    var locationMarkerView = event.popup._source.markerView.locationMarkerView;
                    locationMarkerView.fetch();
                });

                this.listenTo(this.model, 'add', this.render);
                this.listenTo(this.model, 'remove', this.render);
                this.listenTo(this.model, 'change', this.render);

                this.render();
            },
            render: function() {
                JL('iPED Toolkit.Backend')
                    .debug('Rendering map')
                this.renderMarkers();
                this.renderRoutes();
                return this;
            },
            renderMarkers: function() {
                var thiz = this;
                var previousLocation = null;
                var previousMarkerView = null;

                this.markersFeatureGroup.clearLayers();
                this.markerViews = this.model.map(function(location) {
                    var locations = new Locations();

                    if (previousLocation &&
                        previousLocation.get('lat') == location.get('lat') && previousLocation.get('lon') == location.get('lon')) {
                        // There are two markers on top of each other (e.g., one location in two 'states').
                        // Clear the previous one and apply special treatment to the new one
                        previousMarkerView.removeMarker();
                        locations = previousMarkerView.model;
                    }
                    locations.add(location);
                    var markerView = new MarkerView({
                        backend: thiz.backend,
                        map: thiz.markersFeatureGroup,
                        model: locations
                    });

                    previousLocation = location;
                    previousMarkerView = markerView;
                    markerView.render();
                    return markerView;
                });
            },
            renderRoutes: function() {
                var thiz = this;
                this.routeViews = [];
                this.routesFeatureGroup.clearLayers();
                this.model.forEach(function(fromLocation) {
                    var fromPoint = L.latLng(fromLocation.get('lat'), fromLocation.get('lon'));
                    fromLocation.get('relatedLocations')
                        .forEach(function(toLocationId) {
                            var toLocation = new Location({
                                id: toLocationId
                            });
                            toLocation.fetch({
                                success: function(model, response, options) {
                                    var routeView;
                                    var toPoint = L.latLng(toLocation.get('lat'), toLocation.get('lon'));

                                    var isNew = true;
                                    thiz.routeViews.forEach(function(_routeView) {
                                        if (_routeView.fromPoint.equals(fromPoint) &&
                                            _routeView.toPoint.equals(toPoint) ||
                                            _routeView.fromPoint.equals(toPoint) &&
                                            _routeView.toPoint.equals(fromPoint)) {

                                            routeView = _routeView;
                                            isNew = false;
                                        }
                                    });

                                    if (isNew) {
                                        routeView = new RouteView({
                                            featureGroup: L.featureGroup()
                                                .addTo(thiz.routesFeatureGroup),
                                            backend: thiz.backend,
                                            fromPoint: fromPoint,
                                            toPoint: toPoint
                                        });
                                        thiz.routeViews.push(routeView);
                                    }
                                    if (_.contains(routeView.routes, [fromLocation, toLocation]) === false) {
                                        routeView.routes.push([fromLocation, toLocation]);
                                    }
                                    routeView.render();
                                },
                                error: function(model, response, options) {
                                    JL('iPED Toolkit.MapView')
                                        .error(respone);
                                }
                            });
                        });
                });
            }
        });

        return MapView;
    }
);
