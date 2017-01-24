var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var validUrl = require('valid-url');

var port = process.env.PORT || 3500;
var dbuser = process.env.MONGOLAB_USER;
var dbpassword = process.env.MONGOLAB_PASSWORD;
var url = 'mongodb://' + dbuser + ':' + dbpassword + '@ds035016.mlab.com:35016/url_shortener';

mongo.connect(url, function (err, db) {
	if (err) throw err;
	db.createCollection('urls', {
		capped: true,
		size: 5242880,
		max: 5000
	});

	app.get('/', function (req, res) {
		res.sendFile('index.html', { root: __dirname });
	});

	app.get('/new/*', function (req, res) {
		var parameter = req.params['0'];
		if (!validUrl.isUri(parameter)) {
			res.json({
				error: 'Invalid URL format!'
			});
			res.end();
		}
		else {
			var id = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);
			var urls = db.collection('urls');
			urls.insert({
				original_url: parameter,
				short_url: req.headers.host + '/' + id
			}, function (err, result) {
				if (err) throw err;
				res.json({
					original_url: result.ops[0]['original_url'],
					short_url: result.ops[0]['short_url']
				});
			});
		}
	});

	app.get('/:id', function (req, res) {
		db.collection('urls').find({
			short_url: req.headers.host + '/' + req.params.id
		}).toArray(function (err, array) {
			if (err) throw err;
			if (array.length === 0) {
				res.json({
					error: 'URL not found in our database!'
				});
			}
			else {
				res.redirect(array[array.length-1]['original_url']);
			}
		});
	})
});

app.listen(port, function () {
	console.log('Listening on port ' + port);	
});
