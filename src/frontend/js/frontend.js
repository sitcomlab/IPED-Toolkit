/*!
* The iPED Toolkit
* Frontend
*
* (c) 2014 Morin Ostkamp, Tobias Brüggentisch, Nicholas Schiestel
* Institute for Geoinformatics (ifgi), University of Münster
*/

/**
 * The frontend of the iPED Toolkit.
 * @constructor
 */
function Frontend() {
  this.locationId = null;
  this.videoHeight = null;
  this.videoWidth = null;
  this.videoOuterHeight = null;
  this.videoOuterWidth = null;
  this.socket = null;
  this.overlay = null;
  
  this.setLocationId(getURLParameters('locationId'));
  this.activateWebSockets();
  this.overlay = new Overlay($('#iPED-Overlay'));
}


/**
 * Activates the web sockets that are used by the remote control.
 */
Frontend.prototype.activateWebSockets = function() {
  this.socket = io.connect(SERVER_URL + PORT);
  this.socket.on('goToLocation', function(data) {
    JL('iPED Toolkit.Frontend').debug(data);
    this.goToLocation(data.locationId);
  });
  JL('iPED Toolkit.Frontend').debug('Web sockets activated.');
};

Frontend.prototype.setLocationId = function(locationId) {
  JL('iPED Toolkit.Frontend').info('Set Location ID to: ' + locationId);
  this.locationId = locationId;
};
	
		loadVideo();
		activateSocketIO();
		
		console.log("video created!");
		var video = $('#iPED-Video')[0];
		video.addEventListener("loadedmetadata", function() {
			//Return video size
			getVideoSize();
		
			//Draw Displays
			//loadDisplays(currentId);
		}, false);
		
		$(window).resize(function() {
			//Draw Displays
			//loadDisplays(currentId);
		});

});







//Update the id of the current video
function setCurrentId(new_id) {
	currentId = new_id;
	console.log("currentId changed to " + currentId);
}

//Load a new video
function loadVideo() {
  console.log("video loading initiated");
  
  var video; 
	
	//Empty video source
	$("#iPED-Video").empty();

  $.ajax({
    'async' : false,
    'url' : SERVER_URL + PORT + 'api/locations/' + currentId,
    'dataType' : 'json',
    'beforeSend' : function(request) {
      console.log("Request prepared");
    },
    'success' : function(data) {
      
      var videoId = data.videos[0];
      $.ajax({
        'async' : false,
        'url' : SERVER_URL + PORT + 'api/videos/' + videoId,
        'dataType' : 'json',
        'beforeSend' : function(request) {
          console.log("Request prepared");
        },
        'success' : function(data) {
          video = data;
        },
        'error' : function(jqXHR, textStatus, errorThrown) {
          alert('' + errorThrown);
        }
      });
      
    },
    'error' : function(jqXHR, textStatus, errorThrown) {
      alert('' + errorThrown);
    }
  });

	//Set the video variable to the right position in the node-array
	console.log(video.url);

	//Fill video tag with source
	$("#iPED-Video").append('<source id ="video_source_mp4" src="' + video.url + '.mp4" type="video/mp4" />');
	$("#iPED-Video").append('<source id ="video_source_ogv" src="' + video.url + '.ogv" type="video/ogg" />');
	console.log("video tag filled with source " + video.url);
	
	// Required for JQuery AOP's method "after"
	return currentId;
}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x : evt.clientX - rect.left,
		y : evt.clientY - rect.top
	};
}

function getVideoSize() {
	var video = $('#iPED-Video')[0];
	video_outer_height = $("#iPED-Video").outerHeight();
	video_outer_width = $("#iPED-Video").outerWidth();
	video_height = video.videoHeight;
	video_width = video.videoWidth;
}

$(document).ready(function() {
  var frontend = new Frontend();
});