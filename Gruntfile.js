module.exports = function(grunt) {
    targethtmlFiles = {
        // Example:
        // 'public/foo.html': 'src/bar.html'
        // means: compile src/bar.html to public/foo.html
        //
        // Frontend
        'public/frontend/index.html'                      : 'src/frontend/index.html',
        'public/frontend/remote.html'                     : 'src/frontend/remote.html',
        'public/frontend/webRTC.html'                     : 'src/frontend/webRTC.html',
        'public/frontend/js/frontend.js'                  : 'src/frontend/js/frontend.js',
        'public/frontend/js/overlayPlugin.js'             : 'src/frontend/js/overlayPlugin.js',
        'public/frontend/js/remote.js'                    : 'src/frontend/js/remote.js',
        'public/frontend/js/webRTC.js'                    : 'src/frontend/js/webRTC.js',
        'public/frontend/js/chromaKeyPlugin.js'           : 'src/frontend/js/chromaKeyPlugin.js',
        'public/frontend/css/frontend.css'                : 'src/frontend/css/frontend.css',
        'public/frontend/css/microphone.css'              : 'src/frontend/css/microphone.css',

        // Remote
        'public/remote/index.html'                        : 'src/remote/index.html',
        'public/remote/js/remote.js'                      : 'src/remote/js/remote.js',
        'public/remote/js/views/LocationsListView.js'     : 'src/remote/js/views/LocationsListView.js',
        'public/remote/css/remote.css'                    : 'src/remote/css/remote.css',
        'public/remote/templates/locationsListView.tpl'   : 'src/remote/templates/locationsListView.tpl',

        // Backend
        'public/backend/index.html'                       : 'src/backend/index.html',
        'public/backend/js/backend.js'                    : 'src/backend/js/backend.js',
        'public/backend/css/backend.css'                  : 'src/backend/css/backend.css',

        'public/backend/templates/locationMarkerView.tpl' : 'src/backend/templates/locationMarkerView.tpl',
        'public/backend/templates/locationEditView.tpl'   : 'src/backend/templates/locationEditView.tpl',
        'public/backend/templates/videoEditView.tpl'      : 'src/backend/templates/videoEditView.tpl',
        'public/backend/templates/overlayEditView.tpl'    : 'src/backend/templates/overlayEditView.tpl',
        'public/backend/templates/relationshipEditView.tpl': 'src/backend/templates/relationshipEditView.tpl',
        'public/backend/templates/aboutView.tpl'          : 'src/backend/templates/aboutView.tpl',

        'public/backend/js/models/Location.js'            : 'src/backend/js/models/Location.js',
        'public/backend/js/models/Locations.js'           : 'src/backend/js/models/Locations.js',
        'public/backend/js/models/Overlay.js'             : 'src/backend/js/models/Overlay.js',
        'public/backend/js/models/Overlays.js'            : 'src/backend/js/models/Overlays.js',
        'public/backend/js/models/Video.js'               : 'src/backend/js/models/Video.js',
        'public/backend/js/models/Videos.js'              : 'src/backend/js/models/Videos.js',
        'public/backend/js/models/Relationship.js'        : 'src/backend/js/models/Relationship.js',

        'public/backend/js/views/LocationEditView.js'     : 'src/backend/js/views/LocationEditView.js',
        'public/backend/js/views/LocationMarkerView.js'   : 'src/backend/js/views/LocationMarkerView.js',
        'public/backend/js/views/MapView.js'              : 'src/backend/js/views/MapView.js',
        'public/backend/js/views/MarkerView.js'           : 'src/backend/js/views/MarkerView.js',
        'public/backend/js/views/VideoEditView.js'        : 'src/backend/js/views/VideoEditView.js',
        'public/backend/js/views/OverlayEditView.js'      : 'src/backend/js/views/OverlayEditView.js',
        'public/backend/js/views/RelationshipEditView.js' : 'src/backend/js/views/RelationshipEditView.js',
        'public/backend/js/views/AboutView.js'            : 'src/backend/js/views/AboutView.js',
        'public/backend/js/views/RouteView.js'            : 'src/backend/js/views/RouteView.js'
    };

    copyFiles = [
        {expand: true, flatten: true, src: ['src/backend/images/**'], dest: 'public/backend/images/', filter: 'isFile'},
        {expand: true, flatten: true, src: ['src/frontend/images/**'], dest: 'public/frontend/images/', filter: 'isFile'},
        {expand: true, flatten: true, src: ['src/frontend/sounds/**'], dest: 'public/frontend/sounds/', filter: 'isFile'},
        {expand: true, flatten: true, src: ['src/frontend/css/fonts**'], dest: 'public/frontend/css/fonts/', filter: 'isFile'},
        {expand: true, flatten: true, src: ['src/remote/images/**'], dest: 'public/remote/images/', filter: 'isFile'}
    ];

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        targethtml: {
            master: {
                files: targethtmlFiles
            },
            develop: {
                files: targethtmlFiles
            },
            developOnServer: {
                files: targethtmlFiles
            }
        },
        jsdoc: {
            all: {
                src: ['README.md', 'src/frontend/js/*.js', 'src/backend/js/*.js'],
                dest: 'public/doc',
                options: {
                    template : 'node_modules/ink-docstrap/template',
                    configure : 'node_modules/ink-docstrap/template/jsdoc.conf.json'
                }
            }
        },
        concat: {
            options: {
                separator: '\n\n'
            },
            backendCSS: {
                src: ['public/lib/*/css/*.css', 'public/backend/css/*.css'],
                dest: 'public/backend/css/backend.css'
            },
            frontendCSS: {
                src: ['public/lib/*/css/*.css', 'public/frontend/css/*.css'],
                dest: 'public/frontend/css/frontend.css'
            },
            remoteCSS: {
                src: ['public/lib/*/css/*.css', 'public/remote/css/*.css'],
                dest: 'public/remote/css/remote.css'
            }
        },
        copy: {
            all: {
                files: copyFiles
            }
        },
        jsbeautifier: {
            all: {
                src : ['src/**/*.js', 'src/**/*.css', 'src/**/*.html'],
                options: {
                    html: {
                        braceStyle: 'collapse',
                        indentChar: ' ',
                        indentScripts: 'keep',
                        indentSize: 4,
                        maxPreserveNewlines: 10,
                        preserveNewlines: true,
                        unformatted: [],
                        wrapLineLength: 0
                    },
                    css: {
                        indentChar: ' ',
                        indentSize: 4
                    },
                    js: {
                        braceStyle: 'collapse',
                        breakChainedMethods: true,
                        e4x: false,
                        evalCode: false,
                        indentChar: ' ',
                        indentLevel: 0,
                        indentSize: 4,
                        indentWithTabs: false,
                        jslintHappy: false,
                        keepArrayIndentation: false,
                        keepFunctionIndentation: false,
                        maxPreserveNewlines: 10,
                        preserveNewlines: true,
                        spaceBeforeConditional: true,
                        spaceInParen: false,
                        unescapeStrings: false,
                        wrapLineLength: 0
                    }
                }
            }
        }
    });

    // Load the plugin that provides the xyz task.
    grunt.loadNpmTasks('grunt-targethtml');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jsbeautifier');

    // Default task(s).
    grunt.registerTask('master',          ['jsbeautifier:all', 'targethtml:master',           'copy:all', 'concat:backendCSS', 'concat:frontendCSS', 'concat:remoteCSS', 'jsdoc:all']);
    grunt.registerTask('develop',         ['jsbeautifier:all', 'targethtml:develop',          'copy:all', 'concat:backendCSS', 'concat:frontendCSS', 'concat:remoteCSS']);
    grunt.registerTask('developOnServer', ['jsbeautifier:all', 'targethtml:developOnServer',  'copy:all', 'concat:backendCSS', 'concat:frontendCSS', 'concat:remoteCSS', 'jsdoc:all']);
};
