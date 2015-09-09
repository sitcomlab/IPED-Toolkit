/*!
 * The IPED Toolkit
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
            var thiz = this;

            JL('IPED Toolkit.ChromaKeyPlugin')
                .info('ChromaKeyPlugin loaded');

            this.enable(true);
            this.sourceVideo = null;
            this.displayCanvas = null;
            this.seriously = new Seriously();
            this.seriouslyCrop = this.seriously.effect('crop');
            this.seriouslyChroma = this.seriously.effect('chroma');

            _.bindAll(this, 'onKeyDown');
            window.addEventListener('keydown', this.onKeyDown);

            if (opts.overlays == null) {
                $(document)
                    .on('[OverlayPlugin]fetchOverlays', function(event, overlays) {
                        thiz.overlaysFetched(overlays);
                    });
            } else {
                this.overlaysFetched(opts.overlays);
            }
        }

        ChromaKeyPlugin.prototype.overlaysFetched = function(overlays) {
            var thiz = this;
            var backboneEvents = _.extend({}, Backbone.Events);

            backboneEvents.listenTo(overlays, 'add', function(overlay) {
                if (thiz.seriouslyCrop) {
                    thiz.handleOverlay(overlay);
                }
            });

            if (overlays.length > 0) {
                overlays.forEach(function(element, index, array) {
                    thiz.handleOverlay(element);
                });
            }
        }

        ChromaKeyPlugin.prototype.handleOverlay = function(overlay) {
            var thiz = this;

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
        };

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
                if ($('#IPED-Overlay iframe')
                    .contents()
                    .find('video')[0] && $('#IPED-Overlay iframe')
                    .contents()
                    .find('video')[0].videoWidth !== 0 && $('#IPED-Overlay iframe')
                    .contents()
                    .find('video')[0].videoHeight !== 0) {

                    if (thiz.sourceVideo == null) {
                        thiz.sourceVideo = $('#IPED-Overlay iframe')
                            .contents()
                            .find('video');
                        thiz.seriouslySource = thiz.seriously.source(thiz.sourceVideo[0]);
                    }

                    if (thiz.displayCanvas == null) {
                        thiz.sourceVideo.before('<canvas id="chroma-key-canvas" width="' + thiz.sourceVideo[0].videoWidth + '" height="' + thiz.sourceVideo[0].videoHeight + '" style="max-width: 100%;"></canvas>');
                        thiz.displayCanvas = $('#IPED-Overlay iframe')
                            .contents()
                            .find('#chroma-key-canvas');
                        thiz.seriouslyTarget = thiz.seriously.target(thiz.displayCanvas[0]);
                    }

                    thiz.sourceVideo.css('position', 'absolute');
                    thiz.sourceVideo.css('top', '0px');
                    thiz.sourceVideo.css('left', '-99999px');
                    thiz.displayCanvas.css('position', 'absolute');
                    thiz.displayCanvas.css('top', '0');
                    thiz.displayCanvas.css('left', '0');

                    thiz.seriouslyCrop.source = thiz.seriouslySource;
                    thiz.seriouslyChroma.clipWhite = 1.0;
                    thiz.seriouslyChroma.clipBlack = 0.8;
                    thiz.seriouslyChroma.source = thiz.seriouslyCrop;
                    thiz.seriouslyTarget.source = thiz.seriouslyChroma;

                    thiz.seriously.go();
                } else {
                    setTimeout(function() {
                        _enable(thiz);
                    }, 1000);
                }
            };

            this.isEnabled = isEnabled;
            JL('IPED Toolkit.ChromaKeyPlugin')
                .info('Chroma Keying is now turned ' + (this.isEnabled ? 'on' : 'off'));

            if (this.isEnabled) {
                _enable(this);
            } else {
                this.seriously.stop();

                this.sourceVideo.css('position', 'absolute');
                this.sourceVideo.css('top', '0');
                this.sourceVideo.css('left', '0');
                this.displayCanvas.css('position', 'absolute');
                this.displayCanvas.css('top', '0');
                this.displayCanvas.css('left', '-99999px');
            }
        };

        return ChromaKeyPlugin;
    }
);
