var Logger = new (require('../game/Logger.js'))();

var http = require('http');
var express = require('express');
var socketIO = require('socket.io');
var path = require('path');
var jade = require('pug');
var fs = require('fs');

var ActionRequestResponse = require('../game/ActionRequestResponse.js');
var GameWorld = require('../game/GameWorld.js');
var ErrorType = require('../game/ErrorType.js');
var ControlCommand = require('../game/ControlCommand.js');

var HttpServer = function(ip, port, mapDataRelSrc, ipMapCheck) {
  this.SERVER_IP = ip || this.SERVER_IP;
  this.SERVER_PORT = port || this.SERVER_PORT;
  this.MAP_DATA_LOCATION = mapDataRelSrc || this.MAP_DATA_LOCATION;
  this.ipMapCheck = ipMapCheck;

  this.expressApp = express();
  this.expressApp.use(express.json());

  this.httpServer = http.createServer(this.expressApp,{"log level": 0});
  this.webSocketListener = socketIO(this.httpServer);
  this.webSocketListener.on('connection', this.retainLink.bind(this))
  //this.webSocketListener = socketIO.listen(this.httpServer, {"log level": 0});
  //this.webSocketListener.sockets.on('connection', this.retainLink.bind(this));

  this.initialiseGame();
};

HttpServer.prototype.initialiseGame = function() {
	this.gameWorld = new GameWorld(this, this.MAP_DATA_LOCATION, this.ipMapCheck);
};

HttpServer.prototype.initialise = function() {
	Logger.log('Serving address: '+this.SERVER_IP+':'+this.SERVER_PORT);
	this.httpServer.listen(this.SERVER_PORT, this.SERVER_IP, null,()=>{
	  this.serveClient();
    });
};

HttpServer.prototype.serveClient = function() {
  this.expressApp.get('/', function(req, res) {
    var apiData = require('./docs.js');
    var html = jade.renderFile('./jade-templates/docs.pug', apiData);
    res.send(200, html);
  }.bind(this));

  this.expressApp.get('/viewer-client', function(req, res) {
      res.sendfile(this.CONTEXT_ROOT+'/html/index.html');
  }.bind(this));

  this.expressApp.get('/api/java/target/tank-game-api-1.0-SNAPSHOT.jar', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+'/api/java/target/tank-game-api-1.0-SNAPSHOT.jar');
  }.bind(this));
  
  this.expressApp.get('/api/mkzer0.TankGame.zip', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+'/api/mkzer0.TankGame.zip');
  }.bind(this));

  this.expressApp.get('/scripts/*', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.get('/css/*', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.get('/fonts/*', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.get('/resources/*', function(req, res) {
    res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.get('/client/*', function(req, res) {
      res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.get('/game/*', function(req, res) {
      res.sendfile(this.CONTEXT_ROOT+req.url);
  }.bind(this));

  this.expressApp.post('/game', function(req, res) {
    try {
        var result;
        var controlRequest = req.body;
        if (controlRequest.command == ControlCommand.START_GAME) {
          result = this.gameWorld.startGame(controlRequest.options);
        } else if (controlRequest.command == ControlCommand.END_GAME) {
          result = this.gameWorld.endGame();
        }
        if (result instanceof Error) {
          throw result;
        } else {
          res.json(200, {result: result});
        }
    } catch(err) {
      Logger.log(err);
      if (err.statusCode) {
        res.send(err.statusCode, {data_: {error_: err.message, type_: err.type}});
      } else {
        res.send(500, {data_: {error_: 'Server Error', type_: ErrorType.SERVER_ERROR}});
      }
    }
  }.bind(this));

	this.expressApp.post('/tank', function(req, res) {
    try {
      req.body.data_.ip = req.ip;
      var actionRequest = ActionRequestResponse.createFromExpressRequest(req);
      var responseJson = this.gameWorld.handleTankRequest(actionRequest);
      if (responseJson instanceof Error) {
        throw responseJson;
      } else {
        this.notifyViewer(responseJson.viewerNotification);
        res.json(200, responseJson.clientResponse);
      }
    } catch (err) {
      Logger.log(err);
      if (err.statusCode) {
        res.send(err.statusCode, {data_: {error_: err.message, type_: err.type}});
      } else {
        res.send(500, {data_: {error_: 'Server Error', type_: ErrorType.SERVER_ERROR}});
      }
    }
  }.bind(this));

	this.expressApp.post('/tank/:tankId/action', function(req, res) {
    try {
      var actionRequest = ActionRequestResponse.createFromExpressRequest(req);
      this.gameWorld.handleTankActionRequest(actionRequest, function(responseJson) {
        if (responseJson instanceof Error) {
          res.send(
            responseJson.statusCode,
            {data_: {
              error_: responseJson.message,
              type_: responseJson.type
            }}
          );
        } else {
          if (responseJson.viewerNotification) {
            this.notifyViewer(responseJson.viewerNotification);
          }
          res.json(200, responseJson.clientResponse);
        }
      }.bind(this));
    } catch (err) {
      Logger.log(err);
      res.send(500, {data_: {error_: 'Server Error', type_: ErrorType.SERVER_ERROR}});
    }
  }.bind(this));
};

HttpServer.prototype.getTank = function(tankId) {
	return this.gameWorld.getMap().tanks_[tankId];
};

HttpServer.prototype.close = function(onCompleteCallback) {
  Logger.log('Closing the server.'+new Date);
	this.httpServer.close(onCompleteCallback);
};

HttpServer.prototype.retainLink = function(socket) {
  this.viewerClientLink = socket;
  this.viewerClientLink.emit('connected', {response: 'connected'});

  this.viewerClientLink.on('start', function(req, res) {
    if (!this.gameWorld.hasTheGameEnded()) {
      this.gameWorld.endGame();
    }
    this.gameWorld.startGame(req);
    this.viewerClientLink.emit('welcome', {
      response: 'connected',
      map:      this.gameWorld.getMapData()
    });
  }.bind(this));

  this.viewerClientLink.on('stop', function() {
    this.gameWorld.endGame();
  }.bind(this));
};

HttpServer.prototype.notifyViewer = function(actionResultData) {
  if (this.viewerClientLink && actionResultData != null && actionResultData != undefined) {
	  this.viewerClientLink.emit('actionResult', actionResultData);
  }
};

HttpServer.prototype.setActionDelaysToZero = function() {
  GameWorld.delayTime.beforeMove = 0;
  GameWorld.delayTime.afterMove = 0;
  GameWorld.delayTime.beforeAttack = 0;
  GameWorld.delayTime.afterAttack = 0;
  GameWorld.delayTime.beforeScan = 0;
  GameWorld.delayTime.afterScan = 0;
};

HttpServer.prototype.CONTEXT_ROOT = path.resolve(__dirname+'/..');

HttpServer.prototype.SERVER_IP = '127.0.0.1';
HttpServer.prototype.SERVER_PORT = '9999';
HttpServer.prototype.MAP_DATA_LOCATION = 'MapData.js';

module.exports = HttpServer;
