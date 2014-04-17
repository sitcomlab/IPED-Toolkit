var express = require('express');
var app = express();

app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

app.get('/api-url/:id', function(req, res){
	res.send('Hello World' + req.params.id);
	console.log(req.params.id);
});

app.listen(8080);
console.log("App listens on http://localhost:8080");