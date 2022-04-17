var FileSystem = require('fs');
var HttpRequest = require('request');
var SocketClient = require('socket.io-client');
var Crypto = require('crypto');
var jade = require('pug');

var ActionType = require('../../game/ActionType.js');
var ErrorType = require('../../game/ErrorType.js');
var ActionRequestResponse = require('../../game/ActionRequestResponse.js');
var GameWorld = require('../../game/GameWorld.js');
var HttpServer = require('../../server/HttpServer.js');
var ControlCommand = require('../../game/ControlCommand.js');
var ControlResult = require('../../game/ControlResult.js');

var Chai = require('chai');
var Sinon = require('sinon');
var SinonChai = require("sinon-chai");
var should = Chai.should();
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);


describe('HttpServer', function() {
	var server;
    var socket;
    var gameWorldStub;

  beforeEach(function() {
    startTestServer();
  });

	function startTestServer() {
		createTestServer();
		initialiseTestServer();
	};

	function createTestServer() {
		server = new HttpServer("127.0.0.1", 9999, "MapData.js");
	};

	function initialiseTestServer() {
		server.initialise();
	};

  afterEach(function() {
    stopServerConnections();
  });

	function stopServerConnections() {
		closeTestSocketConnection();
      try {
            closeTestServer(()=>{});
      } catch(err) {

        console.log(err);
      }
	};

  function closeTestSocketConnection() {
    //if (socket !== null ) {
      //if(socket.socket.connected){
        //socket.disconnect();
      //}
    //}
  };

  function closeTestServer(callback) {
    server.close(callback);
  };

	describe('HttpServer()', function() {
		it('should create a server object that contains an expressApp and ' +
      'HttpServer', function() {
        server.expressApp.should.be.ok;
        server.httpServer.should.be.ok;
        server.webSocketListener.should.be.ok;
		  }
    )
	});

	describe('initialise()', function() {
		it('should getTankInitialProperties the express app to start listening for requests',
      function(done) {
        HttpRequest.get('http://'+server.SERVER_IP+':'+server.SERVER_PORT+'/',
          function (err, res, body) {
            res.statusCode.should.eql(200);
            done();
          }
        );
		  }
    );

		it('should getTankInitialProperties the webSocketListener to start listening for requests', function(done) {
      startTestSocketConnection();
			socket.on('connected', function(data) {
				data.response.should.eql('connected');
				done();
			});
		});
	});

	describe('retainLink()', function() {
		it('should track the websocket when a client is connects', function(done) {
      startTestSocketConnection();
			socket.on('connected', function(data) {
				server.viewerClientLink.should.be.ok;
				data.response.should.eql('connected');
				done();
			});
      socket.emit('start', {map_: 0, ammo_: -1});
		});
	});

	describe('notifyViewer()', function() {
    it('should emit an actionResult payload on to notify the viewer client', function(done) {
      startTestSocketConnection();
			var sentData = { type: 'test' };
			socket.on('welcome', function(data) {
				data.response.should.eql('connected');
				server.notifyViewer(sentData);
			});
			socket.on('actionResult', function(data) {
				data.should.deep.eql(sentData);
				done();
			});
      socket.emit('start', {map_: 0, ammo_: -1});
		});
	})

  describe('viewerCommandRecieved()', function() {
    beforeEach(function() {
      server.gameWorld = Sinon.createStubInstance(GameWorld);
      server.gameWorld.hasTheGameEnded.returns(true);
    });

    function allowServerToProcessStartEmitEvent(yeild) {
      server.gameWorld.startGame.should.have.been.calledOnce;
      server.gameWorld.startGame.should.have.been.calledOn(server.gameWorld);
      yeild();
    };

    function allowServerToProcessStopEmitEvent(yeild) {
      server.gameWorld.endGame.should.have.been.calledOnce;
      server.gameWorld.endGame.should.have.been.calledOn(server.gameWorld);
      yeild();
    };

    function allowServerToProcessStartEmitEventWhenAlreadyRunning(yeild) {
      server.gameWorld.endGame.should.have.been.calledOnce;
      server.gameWorld.endGame.should.have.been.calledOn(server.gameWorld);
      server.gameWorld.endGame.should.have.been.calledBefore(server.gameWorld.startGame)
      server.gameWorld.startGame.should.have.been.calledOnce;
      server.gameWorld.startGame.should.have.been.calledOn(server.gameWorld);
      yeild();
    };

    it('should start the game when the "start" command is received from the viewer client', function(done) {
      startTestSocketConnection();
      socket.on('connected', function() {
        socket.emit('start', {});
        setTimeout(function() {
          allowServerToProcessStartEmitEvent(done);
        }, 10);
      });
    });

    it('should stop the game when the "stop" command is received from the viewer client and reset the game state', function(done) {
      server.initialiseGame = Sinon.spy();
      startTestSocketConnection();
      socket.on('connected', function() {
        socket.emit('start', {});
        setTimeout(function() {
          allowServerToProcessStartEmitEvent(function() {
            socket.emit('stop', {});
            setTimeout(function() {
              allowServerToProcessStopEmitEvent(done);
            }, 10);
          });
        }, 10);
      });
    });

    it('should stop and already existing game before starting the new game when the "start" command is received from the viewer client', function(done) {
      startTestSocketConnection();
      server.gameWorld.hasTheGameEnded.returns(false);
      socket.on('connected', function() {
        socket.emit('start', {});
        setTimeout(function() {
          allowServerToProcessStartEmitEventWhenAlreadyRunning(done);
        }, 10);
      });
    });
  });

  function startTestSocketConnection() {
    socket = SocketClient.connect('http://' + server.SERVER_IP + ':' + server.SERVER_PORT, {
      'reconnection delay' : 0
      , 'reopen delay' : 0
      , 'force new connection' : true
    });
  };

	describe('GET /', function() {
		it('should return the api docs and download page', function(done) {
      var locals = require('../../server/docs.js');
      var pageHtml = jade.renderFile('./jade-templates/docs.pug', locals);
			HttpRequest.get('http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/', function (err, res, body) {
				if (err) throw err;
				res.statusCode.should.eql(200);
        hash(body).should.deep.eql(hash(pageHtml));
				done();
			});
		});
	});

  function hash(file) {
    return Crypto.createHash('sha1').update(file).digest('hex');
  }

	describe('POST /tank', function() {
    var stubResponse;

    beforeEach(function() {
      server.notifyViewer = Sinon.spy();
      server.gameWorld = Sinon.createStubInstance(GameWorld);
      stubResponse = {viewerNotification: 'stubDataV', clientResponse: 'stubDataC'};
    });

    it('should pass the request to the game world', function(done) {
      server.gameWorld.handleTankRequest.returns(stubResponse);
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank',
        {json: {id_: null, data_: {}, type_: ActionType.CREATE}},
        function (err, res, body) {
          res.statusCode.should.eql(200);
          server.gameWorld.handleTankRequest.should.have.been.calledOnce;
          done();
        }
      );
    });

    it('should notify the viewer client with the appropriate data as returned by the game world.', function(done) {
      server.gameWorld.handleTankRequest.returns(stubResponse);
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank',
        {json: {id_: null, data_: {}, type_: ActionType.CREATE}},
        function (err, res, body) {
          res.statusCode.should.eql(200);
          server.notifyViewer.should.have.been.calledOnce;
          server.notifyViewer.should.have.been.calledWith(stubResponse.viewerNotification);
          done();
        }
      );
    });

    it('should respond to the request with the appropriate data as returned by the game world.', function(done) {
      server.gameWorld.handleTankRequest.returns(stubResponse);
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank',
        {json: {id_: null, data_: {}, type_: ActionType.CREATE}},
        function (err, res, body) {
          res.statusCode.should.eql(200);
          body.should.eql(stubResponse.clientResponse);
          done();
        }
      );
    });

    it('should send status code 500 and an appropriate error message when an error is thrown.', function(done) {
      server.gameWorld.handleTankRequest.throws(new Error('Stub error message!'));
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank',
        {json: {id_: null, data_: {}, type_: ActionType.CREATE}},
        function (err, res, body) {
          res.statusCode.should.eql(500);
          body.should.eql({data_: {error_: 'Server Error', type_: ErrorType.SERVER_ERROR}});
          done();
        }
      );
    });

    it('should handle errors returned from gameworld by sending the code and message specified to the client.', function(done) {
      var error = new Error('Stub error message!');
      error.statusCode = 403;
      error.type = ErrorType.INVALID_TANK_COLOUR;
      server.gameWorld.handleTankRequest.returns(error);
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank',
        {json: {id_: null, data_: {}, type_: ActionType.CREATE}},
        function (err, res, body) {
          res.statusCode.should.eql(error.statusCode);
          body.should.eql({data_: {error_: 'Stub error message!', type_: error.type}});
          done();
        }
      );
    });
	});

  describe('POST /tank/:tankId/action', function() {
    var stubResponse;

    beforeEach(function() {
      server.notifyViewer = Sinon.spy();
      server.gameWorld = Sinon.createStubInstance(GameWorld);
      stubResponse = {viewerNotification: 'stubDataV', clientResponse: 'stubDataC'};
    });

    it('should handle errors thrown from gameWorld by sending the code and message specified to the client.', function(done) {
      var error = new Error('Stub error message!');
      server.gameWorld.handleTankActionRequest.throws(error);
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank/tankId/action',
        {json: {id_: null, data_: {}, type_: ActionType.SCAN}},
        function (err, res, body) {
          res.statusCode.should.eql(500);
          body.should.eql({data_: {error_: 'Server Error', type_: ErrorType.SERVER_ERROR}});
          done();
        }
      );
    });

    it('should pass errors up to the server through the callback function which then should be passed to the client.', function(done) {
      var error = new Error('Stub error message!');
      error.statusCode = 403;
      error.type = ErrorType.HAS_DIED;
      server.gameWorld.handleTankActionRequest = function(x, callback) {
        callback(error);
      }
      HttpRequest.post(
        'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/tank/tankId/action',
        {json: {id_: null, data_: {}, type_: ActionType.SCAN}},
        function (err, res, body) {
          res.statusCode.should.eql(error.statusCode);
          body.should.eql({data_: {error_: 'Stub error message!', type_: error.type}});
          done();
        }
      );
    });
  });

  describe('POST /game', function(){
    var startPayload = { command: ControlCommand.START_GAME, options: { map_: 0, ammo_: -1 } };
    var endPayload = { command: ControlCommand.END_GAME };

    beforeEach(function() {
      server.gameWorld = Sinon.createStubInstance(GameWorld);
    });

    describe('When the game is not yet started.', function() {
      describe('When a the payload ' + JSON.stringify(startPayload) + ' is posted to this resource.', function() {
        it('Should start the game.', function(done) {
          server.gameWorld.startGame.returns(ControlResult.GAME_STARTED);
          HttpRequest.post(
            'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/game',
            {json: startPayload},
            function (err, res, body) {
              server.gameWorld.startGame.should.have.been.calledOnce;
              server.gameWorld.startGame.should.have.been.calledWith(startPayload.options);
              res.statusCode.should.eql(200);
              body.should.eql({result: ControlResult.GAME_STARTED});
              done();
            }
          );
        });
      });
      describe('When a the payload ' + JSON.stringify(endPayload) + ' is posted to this resource.', function() {
        it('Should send an error of type ErrorType.GAME_NOT_IN_PROGRESS.', function(done) {
          var error = new Error('The game is currently not in progress.');
          error.statusCode = 403;
          error.type = ErrorType.GAME_NOT_IN_PROGRESS;
          server.gameWorld.endGame.returns(error);
          HttpRequest.post(
            'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/game',
            {json: endPayload},
            function (err, res, body) {
              server.gameWorld.endGame.should.have.been.calledOnce;
              res.statusCode.should.eql(403);
              body.should.eql({data_: {error_: error.message, type_: error.type}});
              done();
            }
          );
        });
      });
    });

    describe('When the game is in progress.', function() {
      describe('When a the payload startPayload is posted to this resource.', function() {
        it('Should send an error of type ErrorType.GAME_IN_PROGRESS.', function(done) {
          var error = new Error('The game is currently in progress.');
          error.statusCode = 403;
          error.type = ErrorType.GAME_IN_PROGRESS;
          server.gameWorld.startGame.returns(error);
          HttpRequest.post(
            'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/game',
            {json: startPayload},
            function (err, res, body) {
              server.gameWorld.startGame.should.have.been.calledOnce;
              res.statusCode.should.eql(403);
              body.should.eql({data_: {error_: error.message, type_: error.type}});
              done();
            }
          );
        });
      });
      describe('When a the payload endPayload is posted to this resource.', function() {
        it('Should start the game.', function(done) {
          server.gameWorld.endGame.returns(ControlResult.GAME_ENDED);
          HttpRequest.post(
            'http://' + server.SERVER_IP + ':' + server.SERVER_PORT + '/game',
            {json: endPayload},
            function (err, res, body) {
              server.gameWorld.endGame.should.have.been.calledOnce;
              res.statusCode.should.eql(200);
              body.should.eql({result: ControlResult.GAME_ENDED});
              done();
            }
          );
        });
      });
    });
  });

});


