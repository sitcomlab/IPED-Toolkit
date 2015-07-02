/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2015 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Video'
    ],
    function(Backbone, Video) {
        /**
         * The backbone.js view used for editing a video
         */
        VideoEditView = Backbone.View.extend({
            initialize: function(opts) {
                this.backend = opts.backend;
                this.title = opts.title;

                this.render();
            },
            render: function() {
                var thiz = this;

                var video = new Video({
                    id: this.model.video.get('id')
                });

                video.fetch({
                    success: function(model, response, options) {
                        require([TPL_PATH + 'videoEditView.tpl'], function(html) {

                            var template = _.template(html, {
                                video: model,
                                title: thiz.title
                            });
                            thiz.$el.html(template);

                            thiz.$el.find('select[data-role=tagsinput]')
                                .tagsinput({
                                    tagClass: function(item) {
                                        return 'label label-primary';
                                    }
                                });
                            thiz.model.video.get('tags')
                                .forEach(function(tag) {
                                    thiz.$el.find('select[data-role=tagsinput]')
                                        .tagsinput('add', tag);
                                });
                            thiz.$el.find('.bootstrap-tagsinput')
                                .addClass('form-control')
                                .css({
                                    height: "auto"
                                });
                        });
                    },
                    error: function(model, response, options) {
                        JL('iPED Toolkit.Backend')
                            .error(response);
                    }
                });

                return this;
            },
            events: {
                'click button.close': '_close',
                'click button.cancel': '_close',
                'click button.save': '_save'
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
                this.$el.find('button')
                    .attr('disabled', 'disabled');
                this.backend.saveVideo({
                    video: this.model.video,
                    attributes: this.backend.form2js(this.$el.find('form')[0], '.', true),
                    dialog: this
                });
            }
        });

        return VideoEditView;
    }
);
