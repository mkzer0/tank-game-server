var HttpServer = require("./HttpServer");

var ip = process.argv[2] || process.env.IP;
var port = process.argv[3] || process.env.PORT;
var mapDataFile = process.argv[4];

var ipMapCheck = process.argv[5];
if (ipMapCheck == undefined || ipMapCheck === 'true') {
  ipMapCheck = true;
} else if (ipMapCheck === 'false') {
  ipMapCheck = false;
}

var httpServer = new HttpServer(ip, port, mapDataFile, ipMapCheck);
httpServer.initialise();