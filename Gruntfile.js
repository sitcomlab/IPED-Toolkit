module.exports = function(grunt) {
	targethtmlFiles = {
		// Example:
		// 'public/foo.html': 'src/bar.html'
		// means: compile src/bar.html to public/foo.html
		//
		// Frontend
    'public/frontend/index.html'                : 'src/frontend/index.html',
		'public/frontend/remote.html'               : 'src/frontend/remote.html',
		'public/frontend/webRTC.html'               : 'src/frontend/webRTC.html',
		'public/frontend/js/frontend.js'            : 'src/frontend/js/frontend.js',
		'public/frontend/js/overlays.js'            : 'src/frontend/js/overlays.js',
		'public/frontend/js/remote.js'              : 'src/frontend/js/remote.js',
		'public/frontend/js/webRTC.js'              : 'src/frontend/js/webRTC.js',
    'public/frontend/js/chromaKey.js'           : 'src/frontend/js/chromaKey.js',
    'public/frontend/css/frontend.css'          : 'src/frontend/css/frontend.css',
    
		// Backend
		'public/backend/index.html'                 : 'src/backend/index.html',
		'public/backend/js/backend.js'              : 'src/backend/js/backend.js',
		'public/backend/js/leaflet.contextmenu.js'  : 'src/backend/js/leaflet.contextmenu.js',
    'public/backend/css/backend.css'            : 'src/backend/css/backend.css',
    'public/backend/css/leaflet.contextmenu.css': 'src/backend/css/leaflet.contextmenu.css'
	};
	
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
		}
  });

	// Load the plugin that provides the xyz task.
	grunt.loadNpmTasks('grunt-targethtml');

  // Default task(s).
  grunt.registerTask('master',          ['targethtml:master']);
	grunt.registerTask('develop',         ['targethtml:develop']);
	grunt.registerTask('developOnServer', ['targethtml:developOnServer']);
};