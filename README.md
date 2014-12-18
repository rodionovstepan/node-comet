# Node.js comet module (Beta!)

Use:
	node server.js
To start chat example server

## Client side:
* constructor: new cometClent(server [string], anonymous [boolean]);
	- server: path to application like: http://example.com/:8080 or /server if you have routes
	- anonymous: set true if you don't want to remember users
* onRecieve(callback [function])
* connect(data [object])
* disconnect(data [object])
* send(data [object])

Usage:
	var client = new cometClient('ajax-request-path');
	
	client.onRecieve(function(data) {
		// handler
	});
	
	client.connect({text: 'Create data (unnecessary)'});
	client.send({text: 'Sent data'});
	
## Server side
* constructor: new comet.server(timeout [integer]);
* onRecieve(user [object], callback [function])
* onConnect(user [object], callback [function])
* onDisconnect(user [object], callback [function])

Usage:
	var comet = require('./lib/comet');
	var server = new comet.server(30000);
	
	server.onRecieve(function(user, data) {
		user.send({text: 'Message to current user'});
	});
	
	server.send('*', {text: 'Message to all users'});
