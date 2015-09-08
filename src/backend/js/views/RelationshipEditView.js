/*!
 * The IPED Toolkit
 * Backend
 *
 * (c) 2015 Tobias Brüggentisch, Morin Ostkamp, Nicholas Schiestel
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'backend/models/Relationship'
    ],
    function(Backbone, Relationship) {
        /**
         * The backbone.js view used for editing a relationship
         */
        RelationshipEditView = Backbone.View.extend({
            initialize: function(opts) {
                this.backend = opts.backend;
                this.title = opts.title;

                this.render();
            },
            render: function() {

                var thiz = this;

                var relationship = new Relationship({
                    id: this.model.relationship.get('id')
                });

                relationship.fetch({
                    success: function(model, response, options) {
                        require([TPL_PATH + 'relationshipEditView.tpl'], function(html) {

                            var template = _.template(html, {
                                relationship: model,
                                title: thiz.title
                            });
                            thiz.$el.html(template);

                            thiz.$el.find('select[data-role=tagsinput]')
                                .tagsinput({
                                    tagClass: function(item) {
                                        return 'label label-primary';
                                    }
                                });

                            thiz.model.relationship.get('intents')
                                .forEach(function(intent) {
                                    thiz.$el.find('select[data-role=tagsinput]')
                                        .tagsinput('add', intent);
                                });
                            thiz.$el.find('.bootstrap-tagsinput')
                                .addClass('form-control')
                                .css('padding-top', '5px')
                                .css('padding-bottom', '5px')
                                .css('width', '100%')
                                .css('height', 'auto');
                        });
                    },
                    error: function(model, response, options) {
                        JL('IPED Toolkit.Backend')
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
                this.backend.saveRelationship({
                    relationship: this.model.relationship,
                    attributes: this.backend.form2js(this.$el.find('form')[0], '.', true),
                    dialog: this
                });
            }
        });

        return RelationshipEditView;
    }
);
