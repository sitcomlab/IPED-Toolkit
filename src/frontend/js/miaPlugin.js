/*!
 * The IPED Toolkit
 * MIA Plugin
 *
 * (c) 2015 Morin Ostkamp
 * Institute for Geoinformatics (ifgi), University of Münster
 */

define(['underscorejs/js/underscore'],

    function(Underscore) {

        /**
         * MIA Plugin constructor
         * @constructor
         */
        function MiaPlugin(opts) {
            JL('IPED Toolkit.MiaPlugin')
                .info('MiaPlugin loaded');

            this.parent = opts.parent;
            this.socket = opts.parent.socket;

            this.initialize();
        }

        MiaPlugin.prototype.initialize = function() {
            var thiz = this;

            // SHOW AVATAR
            this.socket.on('[MIA]showAvatar', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('showAvatar: ' + data);
                $('#IPED-Avatar')
                    .show();
            });

            // HIDE AVATAR
            this.socket.on('[MIA]hideAvatar', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('hideAvatar: ' + data);
                $('#IPED-Avatar')
                    .hide();
            });

            // MOVE AVATAR UP
            this.socket.on('[MIA]moveAvatarUp', function(data) {
                JL('IPED Toolkit.MiaPugin')
                    .debug('moveAvatarUp: ' + data);
                // To-Do
            });

            // MOVE AVATAR DOWN
            this.socket.on('[MIA]moveAvatarDown', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarDown: ' + data);
                // To-Do
            });

            // MOVE AVATAR TO THE LEFT
            this.socket.on('[MIA]moveAvatarLeft', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarLeft: ' + data);
                // To-Do
            });

            // MOVE AVATAR TO THR RIGHT
            this.socket.on('[MIA]moveAvatarRight', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('moveAvatarRight: ' + data);
                // To-Do
            });

            // MOVE AVATAR FORWARD
            // @Morin says: DO NOT SCALE THE AVATAR!!! Use three.js to move it back and forth in the 3D space!
            this.socket.on('[MIA]moveAvatarForward', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('scaleAvatarUp: ' + data);
                // To-Do
            });

            // MOVE AVATAR BACKWARD
            // @Morin says: DO NOT SCALE THE AVATAR!!! Use three.js to move it back and forth in the 3D space!
            this.socket.on('[MIA]moveAvatarBackward', function(data) {
                JL('IPED Toolkit.MiaPlugin')
                    .debug('scaleAvatarDown: ' + data);
                // To-Do
            });
        };

        MiaPlugin.prototype.enableEventListeners = function(enabled) {
            if (enabled) {
                window.addEventListener('keydown', this.onKeyDown);
            } else {
                window.removeEventListener('keydown', this.onKeyDown);
            }
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
                    this.scaleUp();
                    break;
                case 78: // N
                    this.scaleDown();
                    break;
            }
        };

        MiaPlugin.prototype.moveUp = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.y += 1;
        }

        MiaPlugin.prototype.moveDown = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.y -= 1;
        }

        MiaPlugin.prototype.moveLeft = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.x -= 1;
        }

        MiaPlugin.prototype.moveRight = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.x += 1;
        }

        MiaPlugin.prototype.scaleDown = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.z -= 1;
        }

        MiaPlugin.prototype.scaleUp = function() {
            if (!this.objects[0]) {
                return;
            }
            object = this.objects[0];
            object.position.z += 1;
        }
    }
);
