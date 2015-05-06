/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2015 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Locations',
        'backend/models/Videos',
        'backend/models/Overlays',
        'bootbox/js/bootbox.min'
    ],
    function(Backbone, Locations, Videos, Overlays, bootbox) {
        /**
         * The backbone.js view used for editing a location
         */
        LocationEditView = Backbone.View.extend({
            initialize: function(opts) {
                this.backend = opts.backend;
                this.title = opts.title;
                this.isFetched = false;
                this.videos = null;
                this.overlays = null;
                this.render();
            },
            render: function() {
                var thiz = this;
                require([TPL_PATH + 'locationEditView.tpl'], function(html) {
                    var template = _.template(html, {
                        location: thiz.model,
                        title: thiz.title
                    });
                    thiz.$el.html(template);
                    thiz.$el.find('select[data-role=tagsinput]')
                        .tagsinput({
                            tagClass: function(item) {
                                return 'label label-primary';
                            }
                        });
                    thiz.model.get('tags')
                        .forEach(function(tag) {
                            thiz.$el.find('select[data-role=tagsinput]')
                                .tagsinput('add', tag);
                        });
                    thiz.fetch();
                });
                return this;
            },
            update: function() {
                this.isFetched = false;
                this.render();
            },
            fetch: function() {
                var thiz = this;

                if (this.isFetched == true) {
                    return;
                }

                JL('iPED Toolkit.Backend')
                    .debug('Updating the LocationEditView');
                JL('iPED Toolkit.Backend')
                    .debug('Fetch videos in LocationEditView');
                this.videos = new Videos();
                this.videos.fetch({
                    success: function(model, response, options) {

                        /*JL('iPED Toolkit.Backend')
                            .debug(response);*/

                        thiz.$el.find('.videos')
                            .empty();
                        model.forEach(function(video) {
                            var selected = '';
                            if (_.contains(thiz.model.get('videos'), video.get('id'))) {
                                selected = 'selected';
                            }
                            thiz.$el.find('.videos')
                                .append('<option value="' + video.get('id') + '" ' + selected + '>' + video.get('name') + '</option>');
                        });
                    },
                    error: function(model, response, options) {
                        JL('iPED Toolkit.Backend')
                            .error(response);
                    }
                });

                JL('iPED Toolkit.Backend')
                    .debug('Fetch overlays in LocationEditView');
                this.overlays = new Overlays();
                this.overlays.fetch({
                    success: function(model, response, options) {

                        /*JL('iPED Toolkit.Backend')
                            .debug(response);*/

                        thiz.$el.find('.overlays')
                            .empty();
                        model.forEach(function(overlay) {
                            var selected = '';
                            if (_.contains(thiz.model.get('overlays'), overlay.get('id'))) {
                                selected = 'selected';
                            }
                            thiz.$el.find('.overlays')
                                .append('<option value="' + overlay.get('id') + '" ' + selected + '>' + overlay.get('name') + '</option>');
                        });
                    },
                    error: function(model, response, options) {
                        JL('iPED Toolkit.Backend')
                            .error(response);
                    }
                });


                /** WORKING NOTES FROM NICHO:

                    - can't use fetch, because it fetchs all Locations
                    - have to use IDs in "thiz.model.attributes.relatedLocations" to get every Location
                    - these objects can have a name, which can represented in the view
                **/

                /*JL('iPED Toolkit.Backend')
                    .debug('Fetch relatedLocations in LocationEditView');

                for (var i=0; i<thiz.model.attributes.relatedLocations.length; i++ {
                    thiz.model.attributes.relatedLocations.fetch
                    this.relatedLocations = new Location()
                }*/


                /*this.relatedLocations = new Locations();
                this.relatedLocations.fetch({
                    success: function(model, response, options) {

                        thiz.$el.find('.relatedLocations')
                            .empty();
                        thiz.$el.find('.relatedLocations')
                            .html('<table class="table" id="relatedLocationsTable' + relatedLocation.get('id') + '><tbody><tr><th>Name</th><th>Edit</th><th>Delete</th></tr></tbody></table>');
                        model.forEach(function(relatedLocation) {
                            thiz.$el.find('#relatedLocationsTable ' + relatedLocation.get('id') + ' > tbody:last')
                                .append('<tr><td>' + relatedLocation.get('name') + '</td><td><button type="button" class="btn btn-primary"><span class="glyphicon glyphicon-pencil" aria-hidden="true></span></button></td><td><button type="button" class="btn btn-danger"><span class="glyphicon glyphicon-trash" aria-hidden="true></span></button></td></tr>');
                        });
                    },
                    error: function(model, response, options) {
                        JL('iPED Toolkit.Backend')
                            .error(response);
                    }
                });*/

                this.isFetched = true;
            },
            events: {
                'click button.close': '_close',
                'click button.cancel': '_close',
                'click button.save': '_save',
                'click button.add-video': '_addVideo',
                'click button.edit-video': '_editVideo',
                'click button.delete-video': '_deleteVideo',
                'click button.add-overlay': '_addOverlay',
                'click button.edit-overlay': '_editOverlay',
                'click button.delete-overlay': '_deleteOverlay'
            },
            _disableButtons: function() {
                this.$el.find('button')
                    .attr('disabled', 'disabled');
            },
            _enableButtons: function() {
                this.$el.find('button')
                    .removeAttr('disabled');
            },
            _close: function() {
                $(this.el)
                    .dialog('destroy');
            },
            _save: function() {
                this._disableButtons();
                this.backend.saveLocation({
                    location: this.model,
                    attributes: this.backend.form2js(this.$el.find('form')[0], '.', true),
                    dialog: this
                });
            },
            _addVideo: function() {
                this.backend.addVideo();
            },
            _editVideo: function() {
                if (this.$el.find('.videos :selected')
                    .attr('value') == -1) {
                    this.$el.find('.videos')
                        .parentsUntil('div.form-group')
                        .addClass('has-error');
                    alert('Please select a video footage first.');
                    return;
                }

                var videoId = this.$el.find('.videos :selected')
                    .attr('value');
                var video = this.videos.get(videoId);
                this.backend.editVideo({
                    video: video
                });
            },
            _deleteVideo: function() {

                var thiz = this;

                var videoId = this.$el.find('.videos :selected')
                    .attr('value');
                var video = this.videos.get(videoId);

                // Confirmation before deleting
                var question = 'Are you sure you want to delete the video: <b>' + video.attributes.name + '</b>?';
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
                                thiz.backend.deleteVideo({
                                    video: video
                                });
                            }
                        }
                    }
                });

            },
            _addOverlay: function() {
                if (this.$el.find('.videos :selected')
                    .attr('value') == -1) {
                    this.$el.find('.videos')
                        .parentsUntil('div.form-group')
                        .addClass('has-error');
                    alert('Please select a video footage first.');
                    return;
                }
                this.$el.find('.videos')
                    .parentsUntil('div.form-group')
                    .removeClass('has-error');

                var videoId = this.$el.find('.videos :selected')
                    .attr('value');
                var video = this.videos.get(videoId);
                this.backend.addOverlay({
                    video: video
                });
            },
            _editOverlay: function() {
                if (this.$el.find('.videos :selected')
                    .attr('value') == -1) {
                    this.$el.find('.videos')
                        .parentsUntil('div.form-group')
                        .addClass('has-error');
                    alert('Please select a video footage first.');
                    return;
                }
                this.$el.find('.videos')
                    .parentsUntil('div.form-group')
                    .removeClass('has-error');

                if (this.$el.find('.overlays :selected')
                    .length === 0) {
                    this.$el.find('.overlays')
                        .parentsUntil('div.form-group')
                        .addClass('has-error');
                    alert('Please select an overlay first.');
                    return;
                }
                this.$el.find('.overlays')
                    .parentsUntil('div.form-group')
                    .removeClass('has-error');

                var videoId = this.$el.find('.videos :selected')
                    .attr('value');
                var video = this.videos.get(videoId);
                var overlayId = this.$el.find('.overlays :selected')
                    .attr('value');
                var overlay = this.overlays.get(overlayId);
                this.backend.editOverlay({
                    video: video,
                    overlay: overlay
                });
            },
            _deleteOverlay: function() {

                var thiz = this;

                if (this.$el.find('.overlays :selected')
                    .length === 0) {
                    this.$el.find('.overlays')
                        .parentsUntil('div.form-group')
                        .addClass('has-error');
                    alert('Please select an overlay first.');
                    return;
                }
                this.$el.find('.overlays')
                    .parentsUntil('div.form-group')
                    .removeClass('has-error');

                var overlayId = this.$el.find('.overlays :selected')
                    .attr('value');
                var overlay = this.overlays.get(overlayId);

                // Confirmation before deleting
                var question = 'Are you sure you want to delete the overlay: <b>' + overlay.attributes.name + '</b>?';
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
                                this.backend.deleteOverlay({
                                    overlay: overlay
                                });
                            }
                        }
                    }
                });
            }
        });

        return LocationEditView;
    }
);
