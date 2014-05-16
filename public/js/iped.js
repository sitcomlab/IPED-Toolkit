// ########## iPED Frontend ##########

/********************
 1. Global Variables
 *******************/


// Choose suitable one
var SERVER_URL = "http://giv-sitcomlab.uni-muenster.de";
// Production environment
// var SERVER_URL = "http://localhost"; // Developer environment

var currentId;
var video_height;
var video_width;
var video_outer_height;
var video_outer_width;



// activateWebSockets
function activateSocketIO() {

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
console.log("activated SocketIO!");
}



/********************
 2. Event Handler
 *******************/
$(document).ready(function() {
	// executes when complete page is fully loaded, including all frames, objects and images
	
	// Load Overlay Plugin
	new Overlay($('#iPED-Overlay'));
	console.log("created Overlay");

	// navagtion from the map
	var currentId_temp = getURLParameters('currentId');
	
	// check if there is no starting node, use the node with th id=1
	if (currentId_temp == null || currentId_temp == "undefined") {
		setCurrentId(1);
		console.log("the currentId was set to:" + currentId);
		
	} else {
		setCurrentId(currentId_temp);
		console.log("the currentId is:" + currentId);
	}	
		loadVideo(currentId);
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




//Get URL parameter(s); needed for navigating from a map node to a video
// Source: http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
function getURLParameters(paramName) {
	var sURL = window.document.URL.toString();
	if (sURL.indexOf("?") > 0) {
		var arrParams = sURL.split("?");
		var arrURLParams = arrParams[1].split("&");
		var arrParamNames = new Array(arrURLParams.length);
		var arrParamValues = new Array(arrURLParams.length);
		var i = 0;
		for ( i = 0; i < arrURLParams.length; i++) {
			var sParam = arrURLParams[i].split("=");
			arrParamNames[i] = sParam[0];
			if (sParam[1] != "")
				arrParamValues[i] = unescape(sParam[1]);
			else
				arrParamValues[i] = "No Value";
		}

		for ( i = 0; i < arrURLParams.length; i++) {
			if (arrParamNames[i] == paramName) {
				//alert("Param:"+arrParamValues[i]);
				console.log("url-parameters found: " + arrParamValues[i]);
				return arrParamValues[i];
			}
		}
		console.log("No url-parameters found!");
		return;
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