/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'leaflet/js/leaflet'
    ],
    function(Backbone, Leaflet) {
        /**
         * The Backbone.js view for a route between two locations (a leaflet polyline)
         */
        RouteView = Backbone.View.extend({
            initialize: function(opts) {
                this.featureGroup = opts.featureGroup;
                this.backend = opts.backend;
                this.fromLocations = [];
                this.toLocations = [];
                this.fromPoint = null;
                this.toPoint = null;
            },
            render: function() {
                var thiz = this;

                if (this.fromLocations == null ||
                    this.fromLocations.length == 0 ||
                    this.toLocations == null ||
                    this.toLocations.length == 0) {
                    return;
                }

                this.fromPoint = L.latLng(this.fromLocations[0].get('lat'), this.fromLocations[0].get('lon'));
                this.toPoint = L.latLng(this.toLocations[0].get('lat'), this.toLocations[0].get('lon'));

                JL('iPED Toolkit.RouteView')
                    .debug('Draw/Update route: ' + JSON.stringify(this.fromPoint) + ' <-> ' + JSON.stringify(this.toPoint));

                var contextMenuItems = [{
                    index: 0,
                    text: 'Delete route',
                    disabled: true
                }, {
                    index: 1,
                    separator: true
                }];
                this.fromLocations.forEach(function(fromLocation) {
                    thiz.toLocations.forEach(function(toLocation) {
                        if (fromLocation.get('name') != toLocation.get('name')) {
                            contextMenuItems.push({
                                text: '<span class="glyphicon glyphicon-trash"></span> ' + fromLocation.get('name') + ' -> ' + toLocation.get('name'),
                                callback: function(event) {
                                    thiz.backend.deleteRoute({
                                        fromLocation: fromLocation,
                                        toLocation: toLocation
                                    });
                                }
                            });
                        }
                    });
                });

                this.featureGroup.clearLayers();
                this.polyline = L.polyline([this.fromPoint, this.toPoint], {
                    color: 'blue',
                    contextmenu: true,
                    contextmenuInheritItems: false,
                    contextmenuItems: contextMenuItems
                })
                    .addTo(thiz.featureGroup);
            }
        });

        return RouteView;
    }
);
