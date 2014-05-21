/********************************************************************************************
 Node.js Webserver
 ********************************************************************************************
 Table of content

 1. Server-Settings
 2. API
 2.1 GET all locations
 2.2 GET general information about one location
 2.3 GET all nodes next to this location
 2.4 GET a list with all locations and with their current relationships
 2.5 CREATE a new location
 2.6 EDIT a location
 2.7 DELETE a location
 2.8 SET one or more relationships for one location
 2.9 EDIT relations for one location
 2.10 DELETE relations for one location

 *********************************************************************************************/
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


/****************************
 1. Server-Settings
 ****************************/

// Connection to the Neo4j-Database
var db = new neo4j('http://giv-sitcomlab.uni-muenster.de:7474');


// Loading package "Express" for creating a webserver
// Morin: webRTC's screen sharing requires a SSL connection
// Morin: The default password for the server.key file is: morin
var options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

var app = express();
console.log('Morin says: "The PEM passphrase is: morin"');
var httpsServer = require('https').Server(options, app);
httpsServer.listen(8443, function(err) {
  if (err) {
    return console.log('Encountered error starting server: ', err);
  }
});
var httpServer = require('http').Server(app);
httpServer.listen(8080, function(err) {
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


/****************************
 2.0 webRTC
 ****************************/
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
console.log("App listens on " + os.hostname() + ":{" + httpServer.address().port + "|" + httpsServer.address().port + "}");


/****************************
 2. API
 ****************************/

// 2.1 GET all locations
app.get('/api/locations', function(req, res) {

	// Database Query
	db.cypherQuery("match (l:Location) return l", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"locations":' + jsonString + '}');
		return;
	});
});

// 2.2 GET general information about one location
app.get('/api/locations/:id', function(req, res) {
	
	// Query
	var query ="match (l:Location) where l.id=" + req.params.id + " return l ";
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

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"node":' + jsonString + '}');
		return;
	});
});

// 2.3 GET all nodes next to this location
app.get('/api/locations/:id/relations', function(req, res) {

	// Database Query
	db.cypherQuery("MATCH (i:Location)-->(n:Location) WHERE i.id=" + req.params.id + "RETURN n", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;
		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"nodes":' + jsonString + '}');
		return;

	});
});

// 2.4 GET all videos related to a location
app.get('/api/locations/:id/videos', function(req, res) {
	
	var query = "MATCH (l:Location)-->(v:Video) WHERE l.id=" + req.params.id + "RETURN v";
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
		
		console.log(result.data);
		//delivers an array of query results
		console.log(result.columns);
		//delivers an array of names of objects getting returned
		
		var jsonString = JSON.stringify(result.data);
		
		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"videos":' + jsonString + '}');
		return;
	});
});


// 2.5 GET all displays related to one location
app.get('/api/nodes/:id/displays', function(req, res) {

	// Database Query
	db.cypherQuery('match (Location {id:' + req.params.id + '})<-[:located_at]-(display) return display', function(err, result) {

		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		}

		console.log(result.data);
		// delivers an array of query results
		console.log(result.columns);
		// delivers an array of names of objects getting returned

		var jsonString = JSON.stringify(result.data);

		res.writeHead(200, {
			'Content-Type' : 'application/json'
		});
		res.end('{"displays":' + jsonString + '}');
		return;

	});
});

// 2.6 CREATE a new location
app.post('/api/new/location', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Location {id: " + req.body.newvideo.id + ", name:" + req.body.newvideo.name + "description:\"" + req.body.newvideo.description + ", gps: \"[" + req.body.newvideo.gps + "]\", url: \"media/video/" + req.body.newvideo.dataname + "\"," + "tags:\"[" + req.body.newvideo.dataname + "\"]\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Node added!');
			return;
		}
	});
});

// 2.7 EDIT a location
app.put('/api/locations/:id', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Location edited!');
			return;
		}
	});
});

// 2.8 DELETE a location
app.delete ('/api/location/:id', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Location {gps: \"" + req.body.newvideo.gps + "\", url: \"media/video/\"" + req.body.newvideo.dataname + "\"})", function(err, result) {
		if (err) {

			res.writeHead(500, {
				'Content-Type' : 'text/plain'
			});
			res.end("Error:" + err);
			return;

		} else {
			console.log(result.data);
			// delivers an array of query results
			console.log(result.columns);
			// delivers an array of names of objects getting returned

			var jsonString = JSON.stringify(result.data);

			res.writeHead(200, {
				'Content-Type' : 'text/plain'
			});
			res.end('Location deleted!');
			return;
		}
	});
});

// 2.9 SET one or more relationships for one location
app.post('/api/new/locations/:id/relations', function(req, res) {

	// create a relation in both directions for each video
	for ( i = 0; i < req.body.newralations.ids[i].length; i++) {
		// Database Query
		db.cypherQuery("match (v:Location) where v.id=" + req.params.id + " match (q:Location) where q.id = " + req.body.newrelations.ids[i] + " create (v)-[:related]->(q) create (q)-[:related]->(v))", function(err, result) {
			if (err) {

				res.writeHead(500, {
					'Content-Type' : 'text/plain'
				});
				res.end("Error:" + err);
				return;

			} else {
				console.log(result.data);
				// delivers an array of query results
				console.log(result.columns);
				// delivers an array of names of objects getting returned

				var jsonString = JSON.stringify(result.data);

				res.writeHead(200, {
					'Content-Type' : 'text/plain'
				});
				res.end('Relationship(s) added!');
				return;
			}
		});
	}
});

// 2.10 EDIT relations for one location

// 2.11 DELETE relations for one location

