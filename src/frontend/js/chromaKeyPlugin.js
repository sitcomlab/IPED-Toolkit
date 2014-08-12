/*!
 * The iPED Toolkit
 * webRTC chroma keying -- Renders green video background (0, 255, 0) transparent
 *
 * (c) 2014 Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['underscorejs/js/underscore',
        'seriouslyjs/js/seriously',
        'seriouslyjs/js/seriously.chroma'
    ],

    function(Underscore) {
        function ChromaKeyPlugin(opts) {
            JL('iPED Toolkit.ChromaKeyPlugin')
                .info('ChromaKeyPlugin loaded');

            this.parent = opts.parent; // FIXME: Include type check, e.g., $.typeof(opts.parent) === 'overlayPlugin'
            this.enable(true);
            this.sourceVideo = null;

            _.bindAll(this, 'onKeyDown');
            window.addEventListener('keydown', this.onKeyDown);
        }

        ChromaKeyPlugin.prototype.onKeyDown = function(event) {
            switch (event.keyCode) {
                case 75: // k
                    this.enable(!this.isEnabled);
                    break;
            }
        };

        /**
         * Enables or disables the Chroma Key plugin, i.e., hides or shows the raw remote video tag
         */
        ChromaKeyPlugin.prototype.enable = function(isEnabled) {
            var _enable = function(thiz) {
                if ($('#iPED-Overlay iframe')
                    .contents()
                    .find('.remote video')[0] && $('#iPED-Overlay iframe')
                    .contents()
                    .find('.remote video')[0].videoWidth != 0 && $('#iPED-Overlay iframe')
                    .contents()
                    .find('.remote video')[0].videoHeight != 0) {
                    thiz.sourceVideo = $('#iPED-Overlay iframe')
                        .contents()
                        .find('.remote video');
                    thiz.sourceVideo.css('position', 'absolute');
                    thiz.sourceVideo.css('left', '-99999px');

                    if ($('#iPED-Overlay iframe')
                        .contents()
                        .find('#chroma-key-canvas')) {
                        $('#iPED-Overlay iframe')
                            .contents()
                            .find('#chroma-key-canvas')
                            .remove();
                    }
                    thiz.sourceVideo.before('<canvas id="chroma-key-canvas" width="' + thiz.sourceVideo[0].videoWidth + '" height="' + thiz.sourceVideo[0].videoHeight + '" style="max-width: 100%;"></canvas>');
                    thiz.displayCanvas = $('#iPED-Overlay iframe')
                        .contents()
                        .find('#chroma-key-canvas');

                    this.seriously = null;
                    thiz.seriously = new Seriously();
                    thiz.seriouslySource = thiz.seriously.source(thiz.sourceVideo[0]);
                    thiz.seriouslyTarget = thiz.seriously.target(thiz.displayCanvas[0]);
                    thiz.seriouslyChroma = thiz.seriously.effect('chroma');
                    thiz.seriouslyChroma.source = thiz.seriouslySource;
                    thiz.seriouslyTarget.source = thiz.seriouslyChroma;

                    thiz.seriously.go();
                } else {
                    setTimeout(function() {
                        _enable(thiz);
                    }, 1000);
                }
            };

            this.isEnabled = isEnabled;
            JL('iPED Toolkit.ChromaKeyPlugin')
                .info('Chroma Keying is now turned ' + (this.isEnabled ? 'on' : 'off'));

            if (this.isEnabled) {
                _enable(this);
            } else {
                this.seriously.stop();
                this.seriously = null;

                this.displayCanvas.remove();
                this.displayCanvas = null;

                this.sourceVideo.css('position', 'relative');
                this.sourceVideo.css('left', '0');
                this.sourceVideo = null;
            }
        };

        return ChromaKeyPlugin;
    }
);
