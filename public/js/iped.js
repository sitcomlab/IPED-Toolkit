// ########## iPED Frontend ##########

/********************
 1. Global Variables
 *******************/


// Choose suitable one
//var SERVER_URL = "http://giv-sitcomlab.uni-muenster.de"; // Production environment
var SERVER_URL = "http://localhost"; // Developer environment

var currentId;
var video_height;
var video_width;
var video_outer_height;
var video_outer_width;

var socket = io.connect(SERVER_URL+':8080/');
socket.on('news', function(data) {
	console.log(data);
	socket.emit('message', {
		Nachricht : 'Es funktioniert'
	});
});

socket.on('command', function(data) {
	console.log("Command: ");
	console.log(data);
	setCurrentId(data.videoId);
	loadVideo(data.videoId);
	//loadDisplays(data.videoId);
});


/********************
 2. Event Handler
 *******************/
$(document).ready(function() {
		loadVideo(1);
		setCurrentId(1);
		
		// Load Overlay Plugin
		new Overlay($('#iPED-Overlay'));
});


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

//Update the id of the current video
function setCurrentId(new_id) {
	currentId = new_id;
	console.log("currentId changed to " + currentId);
}

//Load a new video
function loadVideo(id) {

	//Empty video source
	$("#iPED-Video").empty();

	var url = SERVER_URL+':8080/api/nodes/' + id;

	//Ajax request for loading the required video data
	var video = (function() {
		var video = null;
		$.ajax({
			'async' : false,
			'url' : url,
			'dataType' : 'json',
			'beforeSend' : function(request) {
				console.log("Request prepared");
			},
			'success' : function(data) {
				video = data;
				console.log(data);
			},
			'error' : function(jqXHR, textStatus, errorThrown) {
				alert('' + errorThrown);
			}
		});
		return video;
	})();

	//Set the video variable to the right position in the node-array
	video = video.node[0];
	console.log(video.url);

	//Fill video tag with source
	$("#iPED-Video").append('<source id ="video_source" src="' + video.url + '.mp4" type="video/mp4" />');
	
	// Required for JQuery AOP's method "after"
	return id;
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