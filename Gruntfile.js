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
    
		// Backend
		'public/backend/index.html'                       : 'src/backend/index.html',
		'public/backend/js/backend.js'                    : 'src/backend/js/backend.js',
    'public/backend/css/backend.css'                  : 'src/backend/css/backend.css',
    'public/backend/templates/locationMarkerView.tpl' : 'src/backend/templates/locationMarkerView.tpl',
    'public/backend/templates/locationEditView.tpl'   : 'src/backend/templates/locationEditView.tpl',
    'public/backend/templates/addOverlay.tpl'         : 'src/backend/templates/addOverlay.tpl'
	};
  
  copyFiles = [
    // includes files within path and its sub-directories
    {expand: true, flatten: true, src: ['src/backend/images/**'], dest: 'public/backend/images/', filter: 'isFile'},
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
      }
    },
    copy: {
      all: {
        files: copyFiles
      }
    }
  });

	// Load the plugin that provides the xyz task.
	grunt.loadNpmTasks('grunt-targethtml');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('master',          ['targethtml:master',           'copy:all', 'concat:backendCSS', 'concat:frontendCSS', 'jsdoc:all']);
	grunt.registerTask('develop',         ['targethtml:develop',          'copy:all', 'concat:backendCSS', 'concat:frontendCSS']);
	grunt.registerTask('developOnServer', ['targethtml:developOnServer',  'copy:all', 'concat:backendCSS', 'concat:frontendCSS', 'jsdoc:all']);
};