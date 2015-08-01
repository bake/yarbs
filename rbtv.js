var http   = require('http');
var moment = require('moment');
var sha1h  = require('sha1-hex');
var config = require('./config');

var rand = function(num) {
	return Math.random().toString(36).slice(num);
};

var base64encode = function(str) {
	return new Buffer(str).toString('base64')
};

exports.get = function(endpoint, callback) {
	var user    = config.api.user;
	var salt    = config.api.salt;
	var id      = config.api.id;
	var created = moment().format("YYYY-MM-DDTHH:mm:ssZZ").trim();
	var nonce   = id + created + rand(10).trim();
	var sha1    = sha1h(nonce + created + salt);

	http.request({
	  host: 'api.rocketmgmt.de',
	  path: '/' + endpoint,
	  headers: {
			'Accept': 'application/json',
			'Authorization': 'WSSE profile="UsernameToken"',
			'X-WSSE': 'UsernameToken Username="' + user + '", PasswordDigest="' + base64encode(sha1) + '", Nonce="' + base64encode(nonce) + '", Created="' + created + '"'
		}
	}, function(response) {
	  var json = ''

	  response.on('data', function (chunk) {
	    json += chunk;
	  });

	  response.on('end', function () {
	    callback(json);
	  });
	}).end();
};
