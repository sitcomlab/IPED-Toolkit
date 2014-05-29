/***********************
 Initialize JQuery UI
 ***********************/

$("button").button();

/********************
 1. Global Variables
 *******************/
var SERVER_URL = "http://giv-sitcomlab.uni-muenster.de";
var PORT = ":8080/";
var currentId;
var video_height;
var video_width;
var video_outer_height;
var video_outer_width;
var socket = io.connect(SERVER_URL + PORT);
socket.on('news', function(data) {
	console.log(data);
	socket.emit('message', {
		Nachricht : 'Es funktioniert'
	});
});

/********************
 2. Event Handler
 *******************/

$(document).ready(function() {
	loadDescription(1);
	loadButtons(1);
	setCurrentId(1);

});

var video = document.getElementById("video");

/********************
 3. Functions
 *******************/

//Loads the buttons for the current video
function loadButtons(videoId) {
	var id = videoId;
	var url = SERVER_URL + PORT + 'api/locations/' + id + '/relations';

	//Ajax request for loading the video information
	var json = (function() {
		var json = null;
		$.ajax({
			'async' : false,
			'url' : url,
			'dataType' : 'json',
			'beforeSend' : function(request) {
				console.log("Request prepared");
			},
			'success' : function(data) {
				json = data;
				console.log(data);
			},
			'error' : function(jqXHR, textStatus, errorThrown) {
				alert('' + errorThrown);
			}
		});
		return json;
	})();

	//Set the json variable to the array which contains the data
	json = json.locations;
	//currentVideo = json;
	console.log(json);

	//Load Description
	loadDescription(videoId);

	//Empty the "buttons"-div
	$("#buttons").empty();

	//Fill the "buttons"-div with the new buttons
	for (var i = 0; i < json.length; i++) {
		$("#buttons").append('<a href="#" class="ui-btn" onclick="setCurrentId(' + json[i].id + '); loadVideoCommand(' + json[i].id + ');">Navigate to ' + json[i].name + '</a>');
	}

}

//Update the id of the current video
function setCurrentId(new_id) {
	currentId = new_id;
	console.log("currentId changed to " + currentId);
}

//Load a new video
function loadVideoCommand(id) {
	//Load the buttons of the new video
	loadButtons(id);
	//Remote command
	socket.emit('remote', {
		videoId : id
	});

}

//Load Video Description
function loadDescription(id) {
	var url = SERVER_URL + PORT + 'api/locations/' + id;

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
	video = video.location[0];
	console.log(video.url);

	//Empty video description----------------------------------------------------------------------
	
	
	//$("#title").empty();
	//$("#description").empty();

	//Fill video description with source
	$("#video-info h4 #title").text(video.name);
	console.log('gps: ' + video.gps);
	$("#video-info p #description").html('<b>Description: </b><br><br>' + video.description + '<br><br><hr><br>' + '<table>' + '<tr><td><b>Video-ID: </b></td><td>' + video._id + '</td></tr>' + '<tr><td><b>GPS-Coordinates: </b></td><td>' + video.gps + '</td></tr>' + '<tr><td><b>Video-URL: </b></td><td>' + video.url + '</td></tr>' + '<tr><td><b>Tags: </b></td><td>' + video.tags + '</td></tr>' + '</table>');

}

