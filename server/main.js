var HttpServer = require("./HttpServer");

// Default to '0.0.0.0' if no IP is provided
var ip = process.argv[2] || '0.0.0.0';
var port = process.argv[3] || process.env.PORT;
var mapDataFile = process.argv[4];

var httpServer = new HttpServer(ip, port, 'MapData.js');
httpServer.initialise();
