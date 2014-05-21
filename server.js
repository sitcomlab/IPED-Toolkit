/********************************************************************************************
 Node.js Webserver
 ********************************************************************************************
 Table of content

 1. Server-Settings
 2. API
 2.1 GET all nodes
 2.2 GET general information about one node
 2.3 GET all nodes next to this node
 2.4 GET a list with all nodes and with their current relationships
 2.5 CREATE a new node
 2.6 EDIT a node
 2.7 DELETE a node
 2.8 SET one or more relationships for one node
 2.9 EDIT relations for one node
 2.10 DELETE relations for one node

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
var browserify = require('browserify-middleware');


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

// serve the rest statically
app.use(browserify('./public', {debug: false}));
// Serve static content
app.use(express.static(__dirname + '/public'));
console.log("App listens on " + os.hostname() + ":{" + httpServer.address().port + "|" + httpsServer.address().port + "}");


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


/****************************
 2. API
 ****************************/

// 2.1 GET all nodes
app.get('/api/nodes', function(req, res) {

	// Database Query
	db.cypherQuery("match (i:Video) return i", function(err, result) {
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

// 2.2 GET general information about one node
app.get('/api/nodes/:id', function(req, res) {

	// Database Query
	db.cypherQuery("match (i:Video) where i.id=" + req.params.id + " return i ", function(err, result) {
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

// 2.3 GET all nodes next to this node
app.get('/api/nodes/:id/relations', function(req, res) {

	// Database Query
	db.cypherQuery("MATCH (i:Video)-->(n:Video) WHERE i.id=" + req.params.id + "RETURN n", function(err, result) {
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

// 2.4 Get all displays related to one node
app.get('/api/nodes/:id/displays', function(req, res) {

	// Database Query
	db.cypherQuery('match (Video {id:' + req.params.id + '})<-[:located_at]-(display) return display', function(err, result) {

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

// 2.5 CREATE a new node
app.post('/api/new/node', function(req, res) {

	// Database Query
	db.cypherQuery("create (v:Video {id: " + req.body.newvideo.id + ", name:" + req.body.newvideo.name + "description:\"" + req.body.newvideo.description + ", gps: \"[" + req.body.newvideo.gps + "]\", url: \"media/video/" + req.body.newvideo.dataname + "\"," + "tags:\"[" + req.body.newvideo.dataname + "\"]\"})", function(err, result) {
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

// 2.6 EDIT a node
app.put('/api/nodes/:id', function(req, res) {

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
			res.end('Node edited!');
			return;
		}
	});
});

// 2.7 DELETE a node
app.delete ('/api/nodes/:id', function(req, res) {

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
			res.end('Node deleted!');
			return;
		}
	});
});

// 2.8 SET one or more relationships for one node
app.post('/api/new/node/:id/relations', function(req, res) {

	// create a relation in both directions for each video
	for ( i = 0; i < req.body.newralations.ids[i].length; i++) {
		// Database Query
		db.cypherQuery("match (v:Video) where v.id=" + req.params.id + " match (q:Video) where q.id = " + req.body.newrelations.ids[i] + " create (v)-[:related]->(q) create (q)-[:related]->(v))", function(err, result) {
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

// 2.9 EDIT relations for one node

// 2.10 DELETE relations for one node

