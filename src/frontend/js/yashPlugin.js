/*!
 * The IPED Toolkit
 * Yash's transition plugin
 *
 * (c) 2015 Yash Bonno, Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['underscorejs/js/underscore'
        // Add whatever library you need.
        // You may have to adjust public/lib/requirejs/js/config.js
    ],

    function(Underscore) {
        function YashPlugin(opts) {
            var thiz = this;

            JL('IPED Toolkit.YashPlugin')
                .info('YashPlugin loaded');

            // Listen to events, e.g., the one that is fired when the location changes
            $(document)
                .on('[Frontend]setLocationId', this.myFunction);
        }

        YashPlugin.prototype.myFunction = function(parameters) {
            JL('IPED Toolkit.YashPlugin')
                .info('Hey there!');
            // Do something meaningful with regards to transitions,
            // e.g., show a map, zoom in, whatever comes to your mind.

            // Maybe it makes sense that your plugin triggers some event
            // once the transition is done. Other plugins (or the frontend itself)
            // could then be programmed to react accordingly.
            $(document)
                .trigger('[YashPlugin]transitionDone', {
                    additionalData: 4711
                });
        };

        return YashPlugin;
    }
);
