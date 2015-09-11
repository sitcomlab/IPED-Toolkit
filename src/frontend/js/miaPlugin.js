/*!
 * The IPED Toolkit
 * MIA Plugin
 *
 * (c) 2015 Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['underscorejs/js/underscore',
        //'physijs/js/physi'
    ],

    function(Underscore, Physijs, Physijs_Worker) {

        //Physijs.scripts.worker = '../lib/physijs/js/physijs_worker.js';
        //Physijs.scripts.ammo = '../lib/physijs/js/ammo.js';


        /**
         * MIA Plugin constructor
         * @constructor
         */
        function MiaPlugin(opts) {
            var thiz = this;

            JL('IPED Toolkit.MiaPlugin')
                .info('MiaPlugin loaded');

            this.MOVE_BY = 100;
            this.socket = opts.socket;
            this.avatarObject = null;
            this.updateOverlay = opts.updateOverlay;

            _.bindAll(this, 'onKeyDown', 'onKeyUp');

            $(document)
                .on('[OverlayPlugin]createOverlay', function(event, object) {
                    thiz.handleOverlay(object);
                });
            if (opts.object3Ds.length > 0) {
                opts.object3Ds.forEach(function(element, index, array) {
                    thiz.handleOverlay(element);
                });
            }

            $(document)
                .on('[OverlayPlugin]collision', function(event, object) {
                    if (thiz.avatarObject._collisionObject.uuid != object.other_object.object2.uuid) {
                        var otherObject = object.other_object.object2._object.element;
                        otherObject.src = "https://giv-sitcomlab.uni-muenster.de:8445/mia2.html";

                        setTimeout(function() {
                            otherObject.src = "https://giv-sitcomlab.uni-muenster.de:8445/mia1.html";
                        }, 5000);
                    }
                });

            this.initialize();
        }

        MiaPlugin.prototype.handleOverlay = function(object) {
            var thiz = this;

            object._overlay.get('tags')
                .forEach(function(element, index, array) {
                    if (element.indexOf('isMiaAvatar') != -1) {
                        thiz.avatarObject = object;
                        thiz.avatarObject._collisionObject.mass = 1;

                        $(document)
                            .on('[OverlayPlugin]render', function(event) {
                                thiz.avatarObject.position.set(thiz.avatarObject._collisionObject.position.x,
                                    thiz.avatarObject._collisionObject.position.y,
                                    thiz.avatarObject._collisionObject.position.z);
                            });
                    }
                }, thiz);
        };

        MiaPlugin.prototype.initialize = function() {
            var thiz = this;

            this.enableEventListeners(true);

            // SHOW AVATAR
            this.socket.on('[MIA]showAvatar', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('showAvatar: ' + data);
                this.avatarObject.visible = true;
            });

            // HIDE AVATAR
            this.socket.on('[MIA]hideAvatar', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('hideAvatar: ' + data);
                this.avatarObject.visible = false;
            });

            // MOVE AVATAR UP
            this.socket.on('[MIA]moveAvatarUp', function(data) {
                JL('IPED Toolkit.MiaPugin')
                    .debug('moveAvatarUp: ' + data);
                this.moveUp();
            });

            // MOVE AVATAR DOWN
            this.socket.on('[MIA]moveAvatarDown', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarDown: ' + data);
                this.moveDown();
            });

            // MOVE AVATAR TO THE LEFT
            this.socket.on('[MIA]moveAvatarLeft', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarLeft: ' + data);
                this.moveLeft();
            });

            // MOVE AVATAR TO THR RIGHT
            this.socket.on('[MIA]moveAvatarRight', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarRight: ' + data);
                this.moveRight();
            });

            // MOVE AVATAR FORWARD
            // @Morin says: DO NOT SCALE THE AVATAR!!! Use three.js to move it back and forth in the 3D space!
            this.socket.on('[MIA]moveAvatarForward', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarForward: ' + data);
                this.moveForward();
            });

            // MOVE AVATAR BACKWARD
            // @Morin says: DO NOT SCALE THE AVATAR!!! Use three.js to move it back and forth in the 3D space!
            this.socket.on('[MIA]moveAvatarBackward', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarBackward: ' + data);
                this.moveBackward();
            });
        };

        MiaPlugin.prototype.enableEventListeners = function(enabled) {
            if (enabled) {
                window.addEventListener('keydown', this.onKeyDown);
                window.addEventListener('keyup', this.onKeyUp);
            } else {
                window.removeEventListener('keydown', this.onKeyDown);
                window.removeEventListener('keyup', this.onKeyUp);
            }
        };

        MiaPlugin.prototype.onKeyUp = function(event) {
            this.avatarObject._collisionObject.setAngularFactor(new THREE.Vector3(0, 0, 0));
            this.avatarObject._collisionObject.setAngularVelocity(new THREE.Vector3(0, 0, 0));
            this.avatarObject._collisionObject.setLinearFactor(new THREE.Vector3(0, 0, 0));
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(0, 0, 0));
        };

        MiaPlugin.prototype.onKeyDown = function(event) {
            switch (event.keyCode) {
                case 37: // LEFT
                    this.moveLeft();
                    break;
                case 38: // UP
                    this.moveUp();
                    break;
                case 39: // RIGHT
                    this.moveRight();
                    break;
                case 40: // DOWN
                    this.moveDown();
                    break;
                case 77: // M
                    this.moveForward();
                    break;
                case 78: // N
                    this.moveBackward();
                    break;
            }
        };

        MiaPlugin.prototype.moveUp = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(0, this.MOVE_BY, 0));
        }

        MiaPlugin.prototype.moveDown = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(0, -this.MOVE_BY, 0));
        }

        MiaPlugin.prototype.moveLeft = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(-this.MOVE_BY, 0, 0));
        }

        MiaPlugin.prototype.moveRight = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(this.MOVE_BY, 0, 0));
        }

        MiaPlugin.prototype.moveBackward = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(0, 0, -this.MOVE_BY));
        }

        MiaPlugin.prototype.moveForward = function() {
            this.avatarObject._collisionObject.setLinearVelocity(new THREE.Vector3(0, 0, this.MOVE_BY))
        }

        return MiaPlugin;
    }
);
