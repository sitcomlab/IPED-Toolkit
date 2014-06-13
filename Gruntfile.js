module.exports = function(grunt) {
	targethtmlFiles = {
		// Example:
		// 'public/foo.html': 'src/bar.html'
		// means: compile src/bar.html to public/foo.html
		//
		// Frontend
    'public/index.html': 'src/frontend/index.html',
		'public/remote.html': 'src/frontend/remote.html',
		'public/webRTC.html': 'src/frontend/webRTC.html',
		'public/js/aop.min.js': 'src/frontend/aop.min.js',
		'public/js/iped.js': 'src/frontend/iped.js',
		'public/js/map.js': 'src/frontend/map.js',
		'public/js/overlays.js': 'src/frontend/overlays.js',
		'public/js/remote.js': 'src/frontend/remote.js',
		'public/js/socket.io.js': 'src/frontend/socket.io.js',
		'public/js/webRTC.js': 'src/frontend/webRTC.js',
		// Backend
		'public/backend/index.html': 'src/backend/index.html',
		'public/backend/map.html': 'src/backend/map.html'
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
		  }
		}
  });

	// Load the plugin that provides the xyz task.
	grunt.loadNpmTasks('grunt-targethtml');

  // Default task(s).
  grunt.registerTask('master', ['targethtml:master']);
	grunt.registerTask('develop', ['targethtml:develop']);

};