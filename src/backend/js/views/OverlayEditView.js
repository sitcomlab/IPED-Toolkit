/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Overlays',
        'backend/models/Video'
    ],
    function(Backbone, Overlays, Video) {
        /**
         * The backbone.js view used for editing an overlay
         */
        OverlayEditView = Backbone.View.extend({
            initialize: function() {
                this.overlayPlugin = null;
                this.render();
            },
            render: function() {
                var thiz = this;

                var video = new Video({
                    id: this.model.video.get('id')
                });
                video.fetch({
                    success: function(model, response, options) {
                        require([TPL_PATH + 'addOverlay.tpl', '../frontend/js/overlayPlugin'], function(html, OverlayPlugin) {
                            var overlays = new Overlays();
                            overlays.add(thiz.model.overlay);

                            var template = _.template(html, {
                                video: model,
                                overlay: thiz.model.overlay,
                                title: thiz.model.title
                            });
                            thiz.$el.html(template);
                            thiz.$el.find('select[data-role=tagsinput]')
                                .tagsinput({
                                    tagClass: function(item) {
                                        return 'label label-primary';
                                    }
                                });
                            thiz.$el.find('.bootstrap-tagsinput')
                                .addClass('form-group')
                                .css('padding-top', '5px')
                                .css('padding-bottom', '5px')
                                .css('width', '100%');

                            thiz.overlayPlugin = new OverlayPlugin({
                                parent: thiz.model.backend,
                                overlays: overlays,
                                showUI: true
                            });
                            thiz.$el.find('form')
                                .on('focusin', function() {
                                    thiz.overlayPlugin.enableEventListeners(false);
                                });
                            thiz.$el.find('form')
                                .on('focusout', function() {
                                    thiz.overlayPlugin.enableEventListeners(true);
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
                this.overlayPlugin.stop();
                this.overlayPlugin = null;
            },
            _save: function() {
                this.$el.find('button')
                    .attr('disabled', 'disabled');
                this.model.backend.saveOverlay({
                    overlay: this.model.overlay,
                    attributes: this.model.backend.form2js(this.$el.find('form')[0], '.', true),
                    dialog: this
                });
            }
        });

        return OverlayEditView;
    }
);
