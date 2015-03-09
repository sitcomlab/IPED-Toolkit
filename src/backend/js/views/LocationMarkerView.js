/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Overlay',
        'backend/models/Video',
        'succinct/js/succinct.min'
    ],
    function(Backbone, Overlay, Video, Succinct) {
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

                if (this.isFetched == true) {
                    return;
                }

                JL('iPED Toolkit.Backend')
                    .debug('Updating the LocationMarkerView');
                this.model.forEach(function(location) {
                    if (location.get('videos')
                        .length == 0) {
                        thiz.$el.find('.videos[data-location=' + location.get('id') + ']')
                            .html('None');
                    }
                    location.get('videos')
                        .forEach(function(videoId) {
                            var video = new Video({
                                id: videoId
                            });
                            video.fetch({
                                success: function(model, response, options) {
                                    thiz.$el.find('.videos[data-location=' + location.get('id') + '] .spinner')
                                        .remove();
                                    thiz.$el.find('.videos[data-location=' + location.get('id') + ']')
                                        .html(thiz.$el.find('.videos[data-location=' + location.get('id') + ']')
                                            .html() +
                                            '<span>' + model.get('name') + ' (' + model.get('description') + ')' + '</span>');
                                },
                                error: function(model, response, options) {
                                    JL('iPED Toolkit.Backend')
                                        .error(response);
                                }
                            });
                        });

                    if (location.get('overlays')
                        .length == 0) {
                        thiz.$el.find('.overlays[data-location=' + location.get('id') + ']')
                            .html('None');
                    }
                    location.get('overlays')
                        .forEach(function(overlayId) {
                            var overlay = new Overlay({
                                id: overlayId
                            });
                            overlay.fetch({
                                success: function(model, response, options) {
                                    thiz.$el.find('.overlays[data-location=' + location.get('id') + '] .spinner')
                                        .remove();
                                    thiz.$el.find('.overlays[data-location=' + location.get('id') + ']')
                                        .html(thiz.$el.find('.overlays')
                                            .html() +
                                            '<span>' + model.get('name') + ' (' + model.get('description') + ')' + '</span>');
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
                var locationId = $(event.currentTarget)
                    .data('location');
                this.backend.deleteLocation({
                    location: this.model.get(locationId)
                });
            }
        });

        return LocationMarkerView;
    }
);
