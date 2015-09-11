/*!
 * The IPED Toolkit
 * Overlays
 *
 * (c) 2014 Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['backbonejs/js/backbone',
        'threejs/js/three.min',
        'threejs/js/Detector',
        'threejs/js/CSS3DRenderer',
        'threejs/js/TransformControls',
        'physijs/js/physi',
        'underscorejs/js/underscore',
        'socketio/js/socket.io'
    ],

    function(Backbone, THREE, Detector, CSS3DRenderer, TransformControls, Physij, Underscore, Socketio) {

        Physijs.scripts.worker = '/lib/physijs/js/physijs_worker.js';
        Physijs.scripts.ammo = '/lib/physijs/js/ammo.js';

        /**
         * The Backbone.js model of a location
         */
        Location = Backbone.Model.extend({
            urlRoot: '/api/locations',
            initialize: function() {}
        });

        /**
         * The Backbone.js model of an overlay
         */
        Overlay = Backbone.Model.extend({
            urlRoot: '/api/overlays',
            initialize: function() {}
        });

        /**
         * The Backbone.js collection of overlays
         */
        Overlays = Backbone.Collection.extend({
            model: Overlay,
            url: '/api/overlays'
        });

        /**
         * Overlays can be placed on top of a video to create the illusion of 3D objects that are blended into the simulation, e.g., public displays.
         * @constructor
         */
        function OverlayPlugin(opts) {
            var thiz = this;

            JL('IPED Toolkit.OverlayPlugin')
                .info('OverlayPlugin loaded');

            this.socket = opts.socket ||  Socketio();
            this.overlays = opts.overlays || null;

            this.jqueryElement = null;
            this.isRunning = true;
            this.video = null;
            this.top = 0;
            this.left = 0;
            this.width = 0;
            this.height = 0;
            this.location = null;

            this.object3Ds = [];
            this.camera = '';
            this.gridhelper = '';
            this.scene = '';
            this.cssScene = '';
            this.collisionScene = '';
            this.renderer = '';
            this.collisionRenderer = '';
            this.cssRenderer = '';
            this.videos = new Array();
            this.videoTextures = new Array();
            this.showUI = false;
            this.controls = new Array();

            _.bindAll(this, 'render', 'onKeyDown', 'onResize', 'updateOverlay', 'setLocationId');

            this.init();

            $(document)
                .on('[Frontend]setLocationId', function(event, locationId) {
                    thiz.setLocationId(locationId);
                });

            if (opts.location != null) {
                this.setLocationId(opts.location.get('id'));
            }

            if (this.overlays) {
                this.createOverlays();
            }

            this.enableEventListeners(true);

            this.render();

            if (opts.showUI && opts.showUI === true) {
                var thiz = this;
                setTimeout(function() {
                    thiz.toggleUI();
                }, 1000);
            }

            // Show/Hide Overlays from Remote or VoiceControl-Command
            this.socket.on('[Remote]setShowHideOverlays', function(data) {
                JL('IPED Toolkit.Frontend')
                    .debug('Show/Hide overlays: ' + data);

                if (!data) {
                    $('#IPED-Overlay')
                        .hide();
                } else {
                    $('#IPED-Overlay')
                        .show();
                }
            });
        }

        /**
         * Stops the overlay, i.e., requestAnimationFrame
         */
        OverlayPlugin.prototype.stop = function() {
            this.isRunning = false;

            this.camera = null;
            this.gridhelper = null;
            this.scene = null;
            this.cssScene = null;
            this.collisionScene = null;
            this.renderer = null;
            this.collisionRenderer = null;
            this.cssRenderer = null;
            this.videos = null;
            this.videoTextures = null;
            this.controls = null;
        };

        /**
         * Initializes the Overlay plugin
         */
        OverlayPlugin.prototype.init = function() {
            var thiz = this;

            this.video = $('#IPED-Video');
            this.video.on('loadeddata', this.onResize); // Give browsers time to recalculate dimensions
            $(window)
                .resize(function() {
                    thiz.onResize();
                    thiz.render();
                    JL('IPED Toolkit.OverlayPlugin')
                        .debug('Re-sizing and re-layouting overlays.');
                });
            // Create DOM element: <div id="IPED-Overlay"></div>
            if (this.jqueryElement) {
                this.jqueryElement.remove();
            }
            this.video.after('<div id="IPED-Overlay" style="z-index:2"></div>');
            this.jqueryElement = $('#IPED-Overlay');
            this.jqueryElement.css('position', 'absolute');

            // Make sure that Three.js uses CORS to load external urls as textures, for example.
            THREE.ImageUtils.crossOrigin = '';

            this.cssRenderer = new THREE.CSS3DRenderer({
                antialias: true,
                alpha: true
            });
            this.cssRenderer.setSize(this.width, this.height);
            this.cssRenderer.domElement.style.position = 'absolute';
            this.cssRenderer.domElement.style.zIndex = '9999';
            this.jqueryElement.append(this.cssRenderer.domElement);

            if (Detector.webgl) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
                this.collisionRenderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
            } else {
                this.renderer = new THREE.CanvasRenderer();
                this.collisionRenderer = new THREE.CanvasRenderer();
            }
            this.renderer.setSize(this.width, this.height);
            this.collisionRenderer.setSize(this.width, this.height);
            this.renderer.domElement.style.position = 'absolute';
            this.collisionRenderer.domElement.style.position = 'absolute';
            this.jqueryElement.append(this.collisionRenderer.domElement);
            this.jqueryElement.append(this.renderer.domElement);


            this.cssScene = new THREE.Scene();
            this.scene = new THREE.Scene();
            this.collisionScene = new Physijs.Scene;
            this.collisionScene.setGravity(new THREE.Vector3(0, 0, 0));
            this.gridhelper = new THREE.GridHelper(500, 100);
            this.gridhelper.setColors('#00ff00', '#00ff00');
            //this.scene.add(this.gridhelper);

            this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 3000);
            this.camera.position.set(0, 101, 300);
            this.camera.lookAt(new THREE.Vector3(0, 101, 0));

            var light = new THREE.AmbientLight(0xffffff);
            light.position.set(1, 1, 1);
            this.scene.add(light);
        };

        /**
         * Enables or disables the key down event listener
         * @param enabled - true: enables listeners, false: disables listeners
         */
        OverlayPlugin.prototype.enableEventListeners = function(enabled) {
            if (enabled) {
                window.addEventListener('keydown', this.onKeyDown);
            } else {
                window.removeEventListener('keydown', this.onKeyDown);
            }
        };

        /**
         * Hooked to the corresponding frontend method
         */
        OverlayPlugin.prototype.setLocationId = function(locationId) {
            this.locationId = locationId;
            JL('IPED Toolkit.OverlayPlugin')
                .info('Set location ID to: ' + this.locationId);
            this.init();
            this.location = new Location({
                id: locationId
            });
            this.fetchOverlays();
            $(document)
                .trigger('[OverlayPlugin]setLocationId', locationId);
        };

        /**
         * Fetch overlays
         */
        OverlayPlugin.prototype.fetchOverlays = function() {
            var thiz = this;

            this.overlays = new Overlays();
            this.overlays.url = '/api/locations/' + this.location.get('id') + '/overlays';
            this.overlays.fetch({
                success: function(model, response, options) {
                    $(document)
                        .trigger('[OverlayPlugin]fetchOverlays', thiz.overlays);
                    thiz.createOverlays();
                },
                error: function(model, response, options) {
                    JL('IPED Toolkit.OverlayPlugin')
                        .error(respone);
                }
            });
        };

        /**
         * Creates an Three.js object for each overlay
         */
        OverlayPlugin.prototype.createOverlays = function() {
            var thiz = this;

            if (!thiz.overlays || thiz.overlays.length === 0) {
                JL('IPED Toolkit.OverlayPlugin')
                    .info('There are no overlays at this location');
            } else {
                JL('IPED Toolkit.OverlayPlugin')
                    .info('There are ' + thiz.overlays.length + ' overlays at this location');
                JL('IPED Toolkit.OverlayPlugin')
                    .debug(thiz.overlays);
                thiz.overlays.forEach(function(overlay) {
                    var object;
                    var collisionObject;

                    switch (overlay.get('type')) {
                        case 'html':
                            var element = document.createElement('iframe');
                            element.src = overlay.get('url');
                            element.style.width = parseFloat(overlay.get('w')) + 'px';
                            element.style.height = parseFloat(overlay.get('h')) + 'px';
                            element.style.border = '0px';

                            object = new THREE.CSS3DObject(element);
                            thiz.cssScene.add(object);

                            break;


                        case 'video':
                            var n = thiz.videos.push(document.createElement('video')) - 1;
                            thiz.jqueryElement[0].appendChild(thiz.videos[n]);

                            var mp4Source = document.createElement('source');
                            mp4Source.src = overlay.get('url') + '.mp4';
                            mp4Source.type = 'video/mp4';
                            thiz.videos[n].appendChild(mp4Source);

                            var ogvSource = document.createElement('source');
                            ogvSource.src = overlay.get('url') + '.ogg';
                            ogvSource.type = 'video/ogg';
                            thiz.videos[n].appendChild(ogvSource);

                            thiz.videos[n].autoplay = 'autoplay';
                            thiz.videos[n].loop = 'loop';
                            thiz.videos[n].style.display = 'none';

                            if (thiz.videos[n]) {
                                var m = thiz.videoTextures.push(new THREE.Texture(thiz.videos[n])) - 1;
                                var material = new THREE.MeshLambertMaterial({
                                    map: thiz.videoTextures[m]
                                });
                                //thiz.videos[n].play(); // Make sure the video plays
                            }

                            var geometry = new THREE.BoxGeometry(parseFloat(overlay.get('w')), parseFloat(overlay.get('h')), parseFloat(overlay.get('d')));
                            object = new THREE.Mesh(geometry, material);
                            thiz.scene.add(object);

                            break;


                        case 'image':
                            var texture = THREE.ImageUtils.loadTexture(overlay.get('url'), new THREE.UVMapping(), thiz.render);
                            texture.anisotropy = thiz.renderer.getMaxAnisotropy();
                            var material = new THREE.MeshLambertMaterial({
                                map: texture,
                                transparent: true
                            });



                            var geometry = new THREE.BoxGeometry(parseFloat(overlay.get('w')), parseFloat(overlay.get('h')), parseFloat(overlay.get('d')));
                            object = new THREE.Mesh(geometry, material);
                            thiz.scene.add(object);

                            break;


                        default:
                            var material = new THREE.MeshBasicMaterial({
                                color: 0xff0000,
                                side: THREE.DoubleSide
                            });
                            var geometry = new THREE.BoxGeometry(parseFloat(overlay.get('w')), parseFloat(overlay.get('h')), parseFloat(overlay.get('d')));
                            object = new THREE.Mesh(geometry, material);
                            thiz.scene.add(object);

                            break;
                    }

                    object._overlay = overlay;
                    object.position.x = parseFloat(overlay.get('x'));
                    object.position.y = parseFloat(overlay.get('y'));
                    object.position.z = parseFloat(overlay.get('z'));
                    object.rotation.x = parseFloat(overlay.get('rx'));
                    object.rotation.y = parseFloat(overlay.get('ry'));
                    object.rotation.z = parseFloat(overlay.get('rz'));
                    object.scale.x = parseFloat(overlay.get('sx'));
                    object.scale.y = parseFloat(overlay.get('sy'));
                    object.scale.z = parseFloat(overlay.get('sz'));

                    collisionObject = new Physijs.BoxMesh(
                        new THREE.BoxGeometry(parseFloat(overlay.get('w')), parseFloat(overlay.get('h')), parseFloat(overlay.get('d'))),
                        //new THREE.BoxGeometry(parseFloat(overlay.get('w')), parseFloat(overlay.get('h')), 1000 * parseFloat(overlay.get('d'))),
                        Physijs.createMaterial(
                            new THREE.MeshBasicMaterial({
                                color: 0x888888
                            }),
                            .8, // high friction
                            .3 // low restitution
                        ),
                        0
                    );
                    collisionObject._object = object;
                    collisionObject.position.x = parseFloat(overlay.get('x'));
                    collisionObject.position.y = parseFloat(overlay.get('y'));
                    collisionObject.position.z = parseFloat(overlay.get('z'));
                    collisionObject.rotation.x = parseFloat(overlay.get('rx'));
                    collisionObject.rotation.y = parseFloat(overlay.get('ry'));
                    collisionObject.rotation.z = parseFloat(overlay.get('rz'));
                    collisionObject.scale.x = parseFloat(overlay.get('sx'));
                    collisionObject.scale.y = parseFloat(overlay.get('sy'));
                    collisionObject.scale.z = parseFloat(overlay.get('sz'));
                    object._collisionObject = collisionObject;
                    collisionObject.addEventListener('collision', function(other_object, relative_velocity, relative_rotation, contact_normal) {
                        $(document)
                            .trigger('[OverlayPlugin]collision', {
                                other_object: other_object,
                                relative_velocity: relative_velocity,
                                relative_rotation: relative_rotation,
                                contact_normal: contact_normal
                            });
                    });
                    thiz.collisionScene.add(collisionObject);


                    var n = thiz.controls.push(new THREE.TransformControls(thiz.camera, thiz.renderer.domElement)) - 1;
                    thiz.controls[n].addEventListener('change', thiz.updateOverlay);
                    thiz.controls[n].attach(object);
                    //thiz.scene.add(thiz.controls[n]);

                    thiz.object3Ds.push(collisionObject);
                    $(document)
                        .trigger('[OverlayPlugin]createOverlay', object);
                });
                $(document)
                    .trigger('[OverlayPlugin]createOverlays');
            }
        };

        /**
         * Handles key events, e.g., "toggle interactive mode (i)" or "disable chroma keying (k)".
         */
        OverlayPlugin.prototype.onKeyDown = function(event) {
            if (!this.controls) {
                return;
            }
            switch (event.keyCode) {
                case 81: // Q
                    this.controls.forEach(function(control) {
                        control.setSpace(control.space == "local" ? "world" : "local");
                    }, this);
                    break;
                case 87: // W
                    this.controls.forEach(function(control) {
                        control.setMode("translate");
                    }, this);
                    break;
                case 69: // E
                    this.controls.forEach(function(control) {
                        control.setMode("rotate");
                    }, this);
                    break;
                case 82: // R
                    this.controls.forEach(function(control) {
                        control.setMode("scale");
                    }, this);
                    break;
                case 187:
                case 107: // +,=,num+
                    this.controls.forEach(function(control) {
                        control.setSize(control.size + 0.1);
                    }, this);
                    break;
                case 189:
                case 10: // -,_,num-
                    this.controls.forEach(function(control) {
                        control.setSize(Math.max(control.size - 0.1, 0.1));
                    }, this);
                    break;
                case 73: //I
                    this.toggleUI();
                    this.render();
                    break;
            }
        };

        /*
         * Toggles the UI
         */
        OverlayPlugin.prototype.toggleUI = function() {
            if (this.showUI === true) {
                this.controls.forEach(function(control) {
                    this.scene.remove(control);
                }, this);
                this.scene.remove(this.gridhelper);
                this.cssRenderer.domElement.style.zIndex = '9999';
                this.showUI = false;
            } else {
                this.controls.forEach(function(control) {
                    this.scene.add(control);
                }, this);
                this.scene.add(this.gridhelper);
                this.cssRenderer.domElement.style.zIndex = '0';
                this.showUI = true;
            }
        };

        /**
         * Updates Three.js according to window resizing events.
         */
        OverlayPlugin.prototype.onResize = function() {
            this.top = this.video.position()
                .top;
            this.left = this.video.position()
                .left;
            this.width = this.video.width();
            this.height = this.video.height();

            this.jqueryElement.css('top', this.top + 'px');
            this.jqueryElement.css('left', this.left + 'px');
            this.jqueryElement.css('width', this.width + 'px');
            this.jqueryElement.css('height', this.height + 'px');

            if (this.camera) {
                this.camera.aspect = this.width / this.height;
                this.camera.updateProjectionMatrix();
            }

            if (this.cssRenderer) {
                this.cssRenderer.setSize(this.width, this.height);
            }
            if (this.renderer) {
                this.renderer.setSize(this.width, this.height);
            }
            if (this.collisionRenderer) {
                this.collisionRenderer.setSize(this.width, this.height);
            }

            if (this.render) {
                this.render();
            }
        };

        /**
         * Updates the overlay model according to the user control
         */
        OverlayPlugin.prototype.updateOverlay = function(event) {
            var overlay = event.target.object._overlay;
            var collisionObject = event.target.object._collisionObject;
            var position = event.target.object.position;
            var rotation = event.target.object.rotation;
            var scale = event.target.object.scale;

            overlay.set('x', position.x);
            overlay.set('y', position.y);
            overlay.set('z', position.z);
            collisionObject.position.x = position.x;
            collisionObject.position.y = position.y;
            collisionObject.position.z = position.z;
            collisionObject.__dirtyPosition = true;

            overlay.set('rx', rotation.x);
            overlay.set('ry', rotation.y);
            overlay.set('rz', rotation.z);
            collisionObject.rotation.x = rotation.x;
            collisionObject.rotation.y = rotation.y;
            collisionObject.rotation.z = rotation.z;
            collisionObject.__dirtyRotation = true;

            overlay.set('sx', scale.x);
            overlay.set('sy', scale.y);
            overlay.set('sz', scale.z);
            collisionObject.scale.x = scale.x;
            collisionObject.scale.y = scale.y;
            collisionObject.scale.z = scale.z;

            this.render();
        };

        /**
         * Renders the Three.js scene. Is called by window.requestAnimationFrame().
         */
        OverlayPlugin.prototype.render = function() {
            if (this.isRunning) {
                requestAnimationFrame(this.render);
            }

            if (this.videos) {
                var i = 0;
                this.videos.forEach(function(video) {
                    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                        this.videoTextures[i].needsUpdate = true;
                    }
                    i++;
                }, this);
            }

            if (this.controls) {
                this.controls.forEach(function(control) {
                    control.update();
                });
            }

            if (this.collisionScene) {
                this.collisionScene.simulate();
            }

            if (this.cssRenderer) {
                this.cssRenderer.render(this.cssScene, this.camera);
            }

            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }

            /*
            if (this.collisionRenderer) {
                this.collisionRenderer.render(this.collisionScene, this.camera);
            }
            */

            $(document)
                .trigger('[OverlayPlugin]render');
        };

        return OverlayPlugin;
    }
);
