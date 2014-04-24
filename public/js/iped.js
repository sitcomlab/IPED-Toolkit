/***********************
 Initialize JQuery UI
 ***********************/

$("button").button();

/********************
 1. Global Variables
 *******************/

var currentId;

/********************
 2. Event Handler
 *******************/

$(document).ready(function() {
	loadVideo(1);
	loadButtons(1);
	setCurrentId(1);
});

/********************
 3. Functions
 *******************/

//Loads the buttons for the current video
function loadButtons(videoId) {
	var id = videoId;
	var url = 'http://giv-sitcomlab.uni-muenster.de:8080/api/nodes/' + id + '/relations';

	
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
	json = json.nodes;
	console.log(json);
	
	//Empty the "buttons"-div
	$("#buttons").empty();
	
	//Fill the "buttons"-div with the new buttons
	for (var i = 0; i < json.length; i++) {
		$("#buttons").append('<a href="#" class="ui-btn" onclick="setCurrentId(' + json[i].id + '); loadVideo(' + json[i].id + ');">Go to video ' + json[i].id + '</a>');
	}

}

//Update the id of the current video
function setCurrentId(new_id) {
	currentId = new_id;
	console.log("currentId changed to " + currentId);
}

//Load a new video
function loadVideo(id) {
	
	//Empty video source
	$("#video").empty();
	
	var url = 'http://giv-sitcomlab.uni-muenster.de:8080/api/nodes/' + id;
	
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
	$("#video").append('<source id ="video_source" src="' + video.url + '.mp4" type="video/mp4">');
	
	//Load the buttons of the new video
	loadButtons(id);
	
	//Empty video description----------------------------------------------------------------------
	
	//$("#title").empty();
	//$("#description").empty();
	
	//Fill video tag with source
	$("#video-info h4 #title").text(video.id);
	console.log('gps: ' + video.gps);
	$("#video-info p #description").html('<table>'+
			'<tr><td><b>GPS-Coordinates: </b></td><td>' + video.gps + '</td></tr>' +
			'<tr><td><b>Video-URL: </b></td><td>' + video.url + '</td></tr>' + 
			'</table>');
	
}


