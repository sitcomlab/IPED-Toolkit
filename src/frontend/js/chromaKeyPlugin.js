/*!
 * The iPED Toolkit
 * webRTC chroma keying -- Renders green video background (0, 255, 0) transparent
 *
 * (c) 2014 Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['underscorejs/js/underscore',
        'seriouslyjs/js/seriously',
        'seriouslyjs/js/seriously.chroma',
        'seriouslyjs/js/seriously.crop'
    ],

    function(Underscore) {
        function ChromaKeyPlugin(opts) {
            JL('iPED Toolkit.ChromaKeyPlugin')
                .info('ChromaKeyPlugin loaded');

            this.parent = opts.parent; // FIXME: Include type check, e.g., $.typeof(opts.parent) === 'overlayPlugin'
            this.enable(true);
            this.sourceVideo = null;
            this.seriously = new Seriously();
            this.seriouslyCrop = this.seriously.effect('crop');
            this.seriouslyChroma = this.seriously.effect('chroma');

            _.bindAll(this, 'onKeyDown');
            window.addEventListener('keydown', this.onKeyDown);

            var backboneEvents = _.extend({}, Backbone.Events);
            var thiz = this;
            backboneEvents.listenTo(this.parent.overlays, 'add', function(overlay) {
                if (thiz.seriouslyCrop) {
                    overlay.get('tags')
                        .forEach(function(element, index, array) {
                            if (element.indexOf('cropTop') != -1) {
                                thiz.seriouslyCrop.top = element.split('=')[1];
                            }
                            if (element.indexOf('cropBottom') != -1) {
                                thiz.seriouslyCrop.bottom = element.split('=')[1];
                            }
                            if (element.indexOf('cropLeft') != -1) {
                                thiz.seriouslyCrop.left = element.split('=')[1];
                            }
                            if (element.indexOf('cropRight') != -1) {
                                thiz.seriouslyCrop.right = element.split('=')[1];
                            }
                        }, thiz);
                }
            });
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

                    var foobar = document.createElement('video');
                    var attributes = thiz.sourceVideo.prop("attributes");
                    $.each(attributes, function() {
                        $(foobar)
                            .attr(this.name, this.value);
                    });
                    foobar.play();

                    thiz.seriouslySource = thiz.seriously.source(foobar);
                    thiz.seriouslyCrop.source = thiz.seriouslySource;
                    thiz.seriouslyChroma.clipWhite = 1.0;
                    thiz.seriouslyChroma.clipBlack = 0.8;
                    thiz.seriouslyChroma.source = thiz.seriouslyCrop;
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
