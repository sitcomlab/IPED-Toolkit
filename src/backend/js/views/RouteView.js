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
                this.polyline = null;
                this.routes = [];
                this.fromPoint = opts.fromPoint;
                this.toPoint = opts.toPoint;
            },
            render: function() {
                var thiz = this;

                if (this.routes == null ||
                    this.routes.length == 0) {
                    return;
                }

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
                this.routes.forEach(function(route) {
                    contextMenuItems.push({
                        text: '<span class="glyphicon glyphicon-trash"></span> ' + route[0].get('name') + ' -> ' + route[1].get('name'),
                        callback: function(event) {
                            thiz.backend.deleteRoute({
                                fromLocation: route[0],
                                toLocation: route[1]
                            });
                        }
                    });
                });

                this.featureGroup.clearLayers();
                var points = [this.fromPoint, this.toPoint];
                if (this.fromPoint.equals(this.toPoint)) {
                    // Create a small "loop" that is clickable
                    points = [
                        this.fromPoint,
                        L.latLng(this.fromPoint.lat + 0.0001, this.fromPoint.lng),
                        L.latLng(this.fromPoint.lat + 0.0001, this.fromPoint.lng + 0.0002),
                        L.latLng(this.fromPoint.lat, this.fromPoint.lng + 0.0002),
                        this.toPoint
                    ];
                }
                this.polyline = L.polyline(points, {
                    color: 'blue',
                    contextmenu: true,
                    contextmenuWidth: CONTEXTMENU_WIDTH,
                    contextmenuInheritItems: false,
                    contextmenuItems: contextMenuItems
                })
                    .addTo(this.featureGroup);
            }
        });

        return RouteView;
    }
);
