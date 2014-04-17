var express = require('express');
var app = express();

app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

app.get('/api-url', function(req, res){
	res.send('Hallohallo');
});

app.listen(8081);
console.log("App listens on http://localhost:8080");