/***********************
 Initialize JQuery UI
 ***********************/

$("button").button();

/********************
 1. Global Variables
 *******************/

var currentId;
var video_height;
var video_width;
var video_outer_height;
var video_outer_width;

/********************
 2. Event Handler
 *******************/

$(document).ready(function() {
	loadVideo(1);
	loadButtons(1);
	setCurrentId(1);
	
});

displays.addEventListener('click', function(evt) {
        var mousePos = getMousePos(displays, evt);
        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
        console.log(message);
      }, false);       

var video = document.getElementById("video");

video.addEventListener("loadedmetadata", function () {
    //Return video size
	getVideoSize();
	
	//Draw Displays
	loadDisplays(currentId);
}, false);      

$(window).resize(function(){
	loadDisplays(currentId);
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
		$("#buttons").append('<a href="#" class="ui-btn" onclick="setCurrentId(' + json[i].id + '); loadVideo(' + json[i].id + ');">Navigate to ' + json[i].name + '</a>');
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
	$("#video").append('<source id ="video_source" src="' + video.url + '.mp4" type="video/mp4" />');
	
	//Load the buttons of the new video
	loadButtons(id);
	
	
	
	//Empty video description----------------------------------------------------------------------
	
	//$("#title").empty();
	//$("#description").empty();
	
	//Fill video description with source
	$("#video-info h4 #title").text(video.name);
	console.log('gps: ' + video.gps);
	$("#video-info p #description").html(
		    
		    '<b>Description: </b><br><br>' + video.description + '<br><br><hr><br>' +
		    '<table>'+ 
			'<tr><td><b>Video-ID: </b></td><td>' + video._id + '</td></tr>' +
			'<tr><td><b>GPS-Coordinates: </b></td><td>' + video.gps + '</td></tr>' +
			'<tr><td><b>Video-URL: </b></td><td>' + video.url + '</td></tr>' + 
			'<tr><td><b>Tags: </b></td><td>' + video.tags + '</td></tr>' + 
			
			'</table>');
			
	//loadDisplays(id);
}

//Open websocket connection

function openWebSocket(){
	var connection = new WebSocket('ws:giv-sitcomlab.uni-muenster.de:8080', 'soap');
	
	connection.onopen = function(){
		connection.send('Ping');
		console.log('WebSocket connection online');
	};
	
	connection.onerror = function(error){
		console.log('Connection to WebSocket failed');
	};
	
	connection.onmessage = function(e){
		console.log('SERVER: ' + e.data);
	};
}

function loadDisplays(id){
	var url = 'http://giv-sitcomlab.uni-muenster.de:8080/api/nodes/' + id + '/displays';
	var disp_source;
	var video = document.getElementById('video');
	var footage,
		disp_posx,
		disp_posy,
		disp_width,
		disp_height;
	
	var displays_canvas = document.getElementById('displays');
 		displays_canvas.width  = video_width;
        displays_canvas.height = video_height; 
        displays_canvas.style.height = $("#video").outerHeight() + "px";
        displays_canvas.style.width = $("#video").outerWidth() + "px";
        
	var displays = (function() {
		var displays = null;
		$.ajax({
			'async' : false,
			'url' : url,
			'dataType' : 'json',
			'beforeSend' : function(request) {
				console.log("Request prepared");
			},
			'success' : function(data) {
				displays = data.displays[0];
				console.log(data);
			},
			'error' : function(jqXHR, textStatus, errorThrown) {
				alert('' + errorThrown);
			}
		});
		return displays;
	})();
	
	disp_source = displays.url;
	footage = displays.geometry_footage,
	disp_posx = footage[0],
	disp_posy = footage[1],
	disp_width_factor = footage[2],
	disp_height_factor = footage[3];
 	
    if(displays_canvas.getContext){
    	
      var context = displays_canvas.getContext('2d');
      var color = "white";
 
      context.fillStyle=color;
      //context.fillRect(1065, 78, 420/2.8, 150/2.8);
      img = new Image();
      img.onload = function(){
    	context.clearRect(0, 0, context.width, context.height);
    	context.drawImage(img, disp_posx, disp_posy, img.width/disp_width_factor, img.height/disp_height_factor);
       };
      img.src = disp_source;
    }
    
    
    
}

function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
     }   
     
function getVideoSize(){
	var video = document.getElementById("video");
	video_outer_height = $("#video").outerHeight();
	video_outer_width = $("#video").outerWidth();
	video_height = video.videoHeight;
	video_width = video.videoWidth;

}     
       
