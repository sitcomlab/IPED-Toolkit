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
                    .find('video')[0] && $('#iPED-Overlay iframe')
                    .contents()
                    .find('video')[0].videoWidth !== 0 && $('#iPED-Overlay iframe')
                    .contents()
                    .find('video')[0].videoHeight !== 0) {
                    thiz.sourceVideo = $('#iPED-Overlay iframe')
                        .contents()
                        .find('video');
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

                    thiz.displayCanvas = document.createElement('canvas');
                    $(thiz.displayCanvas)
                        .attr('id', 'chroma-key-canvas');
                    $(thiz.displayCanvas)
                        .attr('width', thiz.sourceVideo[0].videoWidth);
                    $(thiz.displayCanvas)
                        .attr('height', thiz.sourceVideo[0].videoHeight);
                    $(thiz.displayCanvas)
                        .attr('style', 'max-width: 100%;');
                    thiz.sourceVideo.before(thiz.displayCanvas);

                    this.seriously = null;
                    thiz.seriously = new Seriously();
                    var foobar = document.createElement('video');
                    var attributes = thiz.sourceVideo.prop("attributes");
                    $.each(attributes, function() {
                        $(foobar)
                            .attr(this.name, this.value);
                    });
                    foobar.play();

                    thiz.seriouslySource = thiz.seriously.source(foobar);

                    thiz.seriouslyChroma = thiz.seriously.effect('chroma');
                    //thiz.seriouslyChroma.weight = 1;
                    //thiz.seriouslyChroma.balance = 1;
                    //thiz.seriouslyChroma.screen = 'rgb(77, 239, 41)';
                    thiz.seriouslyChroma.clipWhite = 1.0;
                    thiz.seriouslyChroma.clipBlack = 0.8;
                    thiz.seriouslyChroma.source = thiz.seriouslySource;

                    thiz.seriouslyTarget = thiz.seriously.target(thiz.displayCanvas);
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
