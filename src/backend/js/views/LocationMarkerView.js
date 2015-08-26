/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2015 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Overlay',
        'backend/models/Video',
        'succinct/js/succinct.min',
        'bootstrap-bootbox/js/bootbox.min'
    ],
    function(Backbone, Overlay, Video, Succinct, bootbox) {
        /**
         * The backbone.js view for a leaflet marker
         */
        LocationMarkerView = Backbone.View.extend({
            initialize: function(opts) {
                this.backend = opts.backend;
                this.isFetched = false;
                this.render();
            },
            render: function() {
                var thiz = this;

                require([TPL_PATH + 'locationMarkerView.tpl'], function(html) {
                    var template = _.template(html, {
                        locations: thiz.model
                    });
                    thiz.$el.html(template);
                    thiz.$el.find('input[data-role=tagsinput]')
                        .tagsinput({
                            tagClass: function(item) {
                                return 'label label-default';
                            }
                        });
                    thiz.$el.find('.succinct')
                        .succinct({
                            size: 100
                        });
                    thiz.model.forEach(function(location) {
                        location.get('tags')
                            .forEach(function(tag) {
                                thiz.$el.find('input[data-role=tagsinput][data-location=' + location.get('id') + ']')
                                    .tagsinput('add', tag);
                            });
                    });
                });
                return this;
            },
            fetch: function() {
                var thiz = this;

                if (this.isFetched === true) {
                    return;
                }

                JL('iPED Toolkit.Backend')
                    .debug('Updating the LocationMarkerView');
                this.model.forEach(function(location) {

                    /* Add videos to popup */
                    if (location.get('videos')
                        .length === 0) {
                        thiz.$el.find('#_videos' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<div id="textNone">None</div>');
                    } else {
                        thiz.$el.find('#_videos' + location.get('id') + '[data-location=' + location.get('id') + '] .spinner')
                            .remove();
                        thiz.$el.find('#_videos' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<table class="table" id="videoTable' + location.get('id') + '"><tr><th>Name</th><th>Description</th></tr></table>');
                    }

                    location.get('videos')
                        .forEach(function(videoId) {
                            var video = new Video({
                                id: videoId
                            });
                            video.fetch({
                                success: function(model, response, options) {

                                    thiz.$el.find('#videoTable' + location.get('id') + '> tbody:last')
                                        .append(
                                            "<tr><td>" + response.name + "</td><td>" + response.description + "</td></tr>"
                                    );

                                },
                                error: function(model, response, options) {
                                    JL('iPED Toolkit.Backend')
                                        .error(response);
                                }
                            });
                        });

                    /* Add overlays to popup */
                    if (location.get('overlays')
                        .length === 0) {
                        thiz.$el.find('#_overlays' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<div id="textNone">None</div>');
                    } else {
                        thiz.$el.find('#_overlays' + location.get('id') + '[data-location=' + location.get('id') + '] .spinner')
                            .remove();
                        thiz.$el.find('#_overlays' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<table class="table" id="overlayTable' + location.get('id') + '"><tr><th>Name</th><th>Description</th></tr></table>');
                    }

                    location.get('overlays')
                        .forEach(function(overlayId) {
                            var overlay = new Overlay({
                                id: overlayId
                            });
                            overlay.fetch({
                                success: function(model, response, options) {

                                    thiz.$el.find('#overlayTable' + location.get('id') + '> tbody:last')
                                        .append(
                                            "<tr><td>" + response.name + "</td><td>" + response.description + "</td></tr>"
                                    );

                                },
                                error: function(model, response, options) {
                                    JL('iPED Toolkit.Backend')
                                        .error(response);
                                }
                            });
                        });


                    /* Add relatedLocations to popup */
                    if (location.get('relatedLocations')
                        .length === 0) {
                        thiz.$el.find('#_relatedLocations' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<div id="textNone">None</div>');
                    } else {
                        thiz.$el.find('#_relatedLocations' + location.get('id') + '[data-location=' + location.get('id') + '] .spinner')
                            .remove();
                        thiz.$el.find('#_relatedLocations' + location.get('id') + '[data-location=' + location.get('id') + ']')
                            .html('<table class="table" id="relLocationTable' + location.get('id') + '"><tr><th>Name</th><th>Description</th></tr></table>');
                    }

                    location.get('relatedLocations')
                        .forEach(function(locationId) {

                            var relatedLocation = new Location({
                                id: locationId
                            });
                            relatedLocation.fetch({
                                success: function(model, response, options) {

                                    thiz.$el.find('#relLocationTable' + location.get('id') + '> tbody:last')
                                        .append(
                                            "<tr><td>" + response.name + "</td><td>" + response.description + "</td></tr>"
                                    );

                                },
                                error: function(model, response, options) {
                                    JL('iPED Toolkit.Backend')
                                        .error(response);
                                }
                            });
                        });

                });
                this.isFetched = true;
            },
            events: {
                'click button.add': '_add',
                'click button.edit': '_edit',
                'click button.delete': '_delete'
            },
            _add: function(event) {
                var locationId = $(event.currentTarget)
                    .data('location');
                this.backend.addLocation({
                    location: this.model.get(locationId)
                });
            },
            _edit: function(event) {
                var locationId = $(event.currentTarget)
                    .data('location');
                this.backend.editLocation({
                    location: this.model.get(locationId)
                });
            },
            _delete: function(event) {

                var thiz = this;

                var locationId = $(event.currentTarget)
                    .data('location');

                var currentLocation = this.model.get(locationId);

                // Confirmation before deleting
                var question = 'Are you sure you want to delete this location: <b>' + currentLocation.attributes.name + '</b>?';
                bootbox.dialog({
                    title: "Attention",
                    message: question,
                    buttons: {
                        cancel: {
                            label: "Cancel",
                            className: "btn-default",
                            callback: function() {}
                        },
                        delete: {
                            label: "OK",
                            className: "btn-primary",
                            callback: function() {
                                thiz.backend.deleteLocation({
                                    location: currentLocation
                                });

                            }
                        }
                    }
                });


            }
        });

        return LocationMarkerView;
    }
);
