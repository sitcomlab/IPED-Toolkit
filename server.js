/********************************************************************************************
 Node.js Webserver
*********************************************************************************************
 Table of content

1. Server-Settings
2. webRTC
3. API
	3.1 Locations:
		3.1.1 GET all locations
		3.1.2 GET all information about one location
		3.1.3 POST a new location [*]
		3.1.4 PUT/EDIT a location [*]
		3.1.5 DELETE a location [*]
		3.1.6 Relationships between locations:
		       3.1.6.1 GET all locations next to this location
		       3.1.6.2 GET a list with all locations and with their current relationships [*]
		       3.1.6.3 POST/ADD one or more relationships for one location [*]
		       3.1.6.4 PUT/EDIT a relationship for one location [*]
		       3.1.6.5 DELETE a relationship between two locations [*]			
	3.2 Videos:
		3.2.1 GET all videos for one location
		3.2.2 GET all information about one video [*]
		3.2.3 POST a new video [*]
		3.2.4 PUT/EDIT a video [*]
		3.2.5 DELETE a video [*]
		3.2.6 Relationship between a video and a location:
		       2.6.1 POST/ADD a relationship for one video [*]
		       2.6.2 PUT/EDIT a relationship for one video [*]
		       2.6.3 DELETE a relationship between a video and a location [*]
	3.3 Overlays:
		3.3.1. GET all overlays for one location
		3.3.2. GET all information about one overlay [*]
		3.3.3. POST a new overlay [*]
		3.3.4. PUT/EDIT an overlay [*]
		3.3.5. DELETE an overlay [*]
	3.4. Scenarios:
		3.4.1 GET a list of all scenarios [x]
		3.4.2 GET meta-data about one scenario [*]
		3.4.3 GET all information/full graph of one scenario [x]
		3.4.4 Relationship between a video and a location
		       3.4.4.1 POST/ADD a scenario [*]
		       3.4.4.2 PUT/EDIT a scenario [*]
		       3.4.4.3 DELETE a scenario [*]
		       3.4.4.4 POST/SET a starting location for one scenario [*]
		       3.4.4.5 EDIT/PUT the starting location for one scenario [*]
    3.5 Users:
        3.5.1 GET useraccount [*]
        3.5.1 POST/ADD useraccount [*]
        3.5.2 PUT/EDIT useraccount [*]
        3.5.3 DELETE useraccount [*]
       

[*] = not yet implemented 
[x] = at the moment in progress 

**********************************************************************************************/


'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var util = require('util');

var neo4j = require('node-neo4j');
var express = require('express');
var stylus = require('stylus');
var socketio = require('socket.io');
var bodyParser = require('body-parser');
var nib = require('nib');
var browserify = require('browserify');


/********************************************************
 1. Server-Settings
*********************************************************/
var HTTP_PORT = 8080;
var HTTPS_PORT = 8443;
var NEO4J_PORT = 7474;

// Pass console parameters (e.g., server port passed by Jenkins)
process.argv.forEach(function (val, index, array) {
	if (val.indexOf('http=') != -1) {
		HTTP_PORT = val.split('=')[1];
	}
	if (val.indexOf('https=') != -1) {
		HTTPS_PORT = val.split('=')[1];
	}
	if (val.indexOf('neo4j=') != -1) {
		NEO4J_PORT = val.split('=')[1];
	}
});
console.log('HTTP_PORT='+HTTP_PORT);
console.log('HTTPS_PORT='+HTTPS_PORT);
console.log('NEO4J_PORT='+NEO4J_PORT);

// Connection to the Neo4j-Database
var db = new neo4j('http://giv-sitcomlab.uni-muenster.de:'+NEO4J_PORT);


// Loading package "Express" for creating a webserver
// Morin: webRTC's screen sharing requires a SSL connection
// Morin: The default password for the server.key file is: morin
var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
  passphrase: 'morin'
};

var app = express();
var httpsServer = require('https').Server(options, app);
httpsServer.listen(HTTPS_PORT, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }
});
var httpServer = require('http').Server(app);
httpServer.listen(HTTP_PORT, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }
});

// Loading package "body-parser" for making POST and PUT requests
app.use(bodyParser());

// Public-folder to upload media, like videos
app.set("view options", {
	layout : false
});


// Socket.io packages
var io = socketio.listen(httpServer);
io.sockets.on('connection', function(socket) {
	io.sockets.emit('news', {
		Info : 'New Connection'
	});
	socket.on('message', function(data) {
		console.log(data);

	});
	socket.on('remote', function(data) {
		io.sockets.emit('command', data);
		console.log(data);
	});
});


/********************************************************
 2. webRTC
*********************************************************/

// create the webRTC switchboard
var switchboard = require('rtc-switchboard')(httpsServer);

// convert stylus stylesheets
app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function(str, sourcePath) {
    return stylus(str)
      .set('filename', sourcePath)
      .set('compress', false)
      .use(nib());
  }
}));

// we need to expose the primus library
app.get('/rtc.io/primus.js', switchboard.library());
app.get('/room/:roomname', function(req, res, next) {
  res.writeHead(200);
  fs.createReadStream(path.resolve(__dirname, 'public', 'webRTC.html')).pipe(res);
});

// serve the rest statically
//app.use(browserify('./public', {debug: false}));
app.get('/js/webRTC.js', function(req, res, next) {
	res.writeHead(200);
	var b = browserify();
	b.add('./public/js/webRTC.js');
	b.bundle().pipe(res);
});


// Serve static content
app.use(express.static(__dirname + '/public'));
//console.log("App listens on " + os.hostname() + ":{" + httpServer.address().port + "|" + httpsServer.address().port + "}");



/********************************************************
 3. API
*********************************************************/


/****************************
 3.1 Locations
****************************/

// 3.1.1 GET all locations
app.get('/api/locations', function(req, res) {
    
    // Query
    var query ="MATCH (l:Location) RETURN l";
    console.log(query);
    
	// Database Query
	db.cypherQuery(query, function(err, result) {
	
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}
        else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
            var jsonString = JSON.stringify(result.data);
    
            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"locations":' + jsonString + '}');
            return;    
        }
		
	});
});

// 3.1.2 GET all information about one location
app.get('/api/locations/:id', function(req, res) {
	
	// Query
	var query ="MATCH (l:Location) WHERE l.id=" + req.params.id + " RETURN l ";
	console.log(query);
	
	// Database Query
	db.cypherQuery(query, function(err, result) {
		if (err) {

			throw err;

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}
        else {
    		//console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
    		var jsonString = JSON.stringify(result.data);
    
    		res.writeHead(200, {
    			'Content-Type' : 'application/json'
    		});
    		res.end('{"location":' + jsonString + '}');
    		return;
    	}
	});
});


// 3.1.6.1 GET all locations next to this location
app.get('/api/locations/:id/relations', function(req, res) {
    
    // Query
    var query ="MATCH (i:Location)-->(n:Location) WHERE i.id=" + req.params.id + " RETURN n";
    console.log(query);
    
	// Database Query
	db.cypherQuery(query, function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}
        else {
    		//console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
    		var jsonString = JSON.stringify(result.data);
    
    		res.writeHead(200, {
    			'Content-Type' : 'application/json'
    		});
    		res.end('{"locations":' + jsonString + '}');
    		return;
        }
	});
});



/****************************
 3.2 Videos
****************************/

//3.2.1 GET all videos for one location
app.get('/api/locations/:id/videos', function(req, res) {
	
	var query = "MATCH (l:Location)-->(v:Video) WHERE l.id=" + req.params.id + " RETURN v";
	console.log(query);
	
	// Database Query
	db.cypherQuery(query, function(err, result) {
		if (err) {
			
			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}
		else {
    		//console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    		
    		var jsonString = JSON.stringify(result.data);
    		
    		res.writeHead(200, {
    			'Content-Type' : 'application/json'
    		});
    		res.end('{"videos":' + jsonString + '}');
    		return;
    	}
	});
});


/****************************
 3.3 Overlays
****************************/

// 3.3.1. GET all overlays for one location
app.get('/api/locations/:id/overlays', function(req, res) {
    
    // Query
    var query ="MATCH (Location {id:" + req.params.id + "})<-[:located_at]-(Overlay) RETURN Overlay";
    console.log(query);
    
	// Database Query
	db.cypherQuery(query, function(err, result) {

		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		}
        else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
    		var jsonString = JSON.stringify(result.data);
    
    		res.writeHead(200, {
    			'Content-Type' : 'application/json'
    		});
    		res.end('{"overlays":' + jsonString + '}');
    		return;
        }
	});
});


/****************************
 3.4 Scenarios
****************************/

// 3.4.1 GET a list of all scenarios [x]
app.get('/api/scenarios', function(req, res) {
    
    // Query
    var query ="MATCH (s:Scenario) RETURN s";
    console.log(query);
    
    // Database Query
    db.cypherQuery(query, function(err, result) {

        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;
        }
        
        else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
            var jsonString = JSON.stringify(result.data);
            console.log(jsonString);

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"scenarios":' + jsonString + '}');
            return;
        }
    });
});


// 3.4.4 GET all information/full graph of one scenario [x]
app.get('/api/scenarios/:id', function(req, res) {

    // Query
    var query ="MATCH (s:Scenario) WHERE s.id=" + req.params.id + " RETURN s";
    console.log(query);
    
    // Database Query
    db.cypherQuery(query, function(err, result) {
 
        if (err) {

            res.writeHead(500, {
                'Content-Type' : 'text/plain'
            });
            res.end("Error:" + err);
            return;

        }
        else {
            //console.log(result.data);
            // delivers an array of query results
            //console.log(result.columns);
            // delivers an array of names of objects getting returned
    
            var jsonString = JSON.stringify(result.data);
            console.log(jsonString);

            res.writeHead(200, {
                'Content-Type' : 'application/json'
            });
            res.end('{"scenario":' + jsonString + '}');
            return;
        }
    });
});