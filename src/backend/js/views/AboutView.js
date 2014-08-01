/*!
 * The iPED Toolkit
 * Backend
 *
 * (c) 2014 Tobias Brüggentisch, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone'],
    function(Backbone) {
        /**
         * The backbone.js view for the about dialog
         */
        AboutView = Backbone.View.extend({
            initialize: function() {
                this.render();
            },
            render: function() {
                var thiz = this;
                require([TPL_PATH + 'aboutView.tpl'], function(html) {
                    var template = _.template(html);
                    thiz.$el.html(template);
                });
                return this;
            },
            events: {
                'click button.close': '_close'
            },
            _close: function() {
                $(this.el)
                    .dialog('destroy');
            }
        });

        return AboutView;
    }
);
