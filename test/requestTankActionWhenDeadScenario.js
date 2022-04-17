
var HttpServer = require('../server/HttpServer.js');
var Tank = require('../game/Tank.js');
var Direction = require('../game/Direction.js');
var ActionType = require('../game/ActionType.js');
var MoveResult = require('../game/MoveResult.js');
var ErrorType = require('../game/ErrorType.js');
var ActionRequestResponse = require('../game/ActionRequestResponse.js');
var EntityType = require('../game/EntityType.js');
var GameWorld = require('../game/GameWorld.js');
var HttpRequest = require('request');

var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('Given I have a server, that has a gameworld and two tanks', function() {
  var clock, server, baseServerUrl, gameWorld, attackingTank, defendingTank;

  before(function() {
    clock = Sinon.useFakeTimers();
  });

  after(function() {
    clock.restore();
  });

  describe('When the first tank attacks and destroys another tank', function() {
    var notifyViewerSpy, requestSpy;

    before(function(done) {
      startTheGame();
      spyOnNotifyViewer();
      setupTestFixtures();
      
      var oldHandle = gameWorld.handleTankActionRequest.bind(gameWorld);
     
      // make the request
      gameWorld.handleTankActionRequest = function(actionRequest, onComplete) {        
        oldHandle(actionRequest, onComplete);
        defendingTank.setHealth(0);
        defendingTank.setRecentlyDied(true);
        clock.tick(GameWorld.delayTime.beforeMove);
      }.bind(gameWorld);
      
      requestSpy = Sinon.spy();
      makeActionRequest('defendingTank', ActionType.MOVE, { direction: Direction.SOUTH },
          function(err, res, body) {
            requestSpy(err, res, body);
            done();
          });
    });

    function spyOnNotifyViewer() {
      notifyViewerSpy = Sinon.spy();
      server.notifyViewer = notifyViewerSpy;
    };

    function setupTestFixtures() {
      var rand = Math.random();
      defendingTank = new Tank('defendingTank', ('Defender '+rand), { x: 1, y: 1 }, 'blue', 10);
      gameWorld.getMap().addTank(defendingTank);
      
      
    };

    after(function() {
      endTheGame();
    });

    it('Should receive a TANK_DEAD notification', function() {
      requestSpy.should.have.been.calledOnce;    
      var resStatusCode = requestSpy.getCall(0).args[1].statusCode;
      var body = requestSpy.getCall(0).args[2];
      console.log(body);
      resStatusCode.should.eql(403);
      (body).data_.type_.should.eql(ErrorType.HAS_DIED);
    });
  });
  
  describe('When a tank is dead, after being notified it is dead,', function() {
      var notifyViewerSpy, requestSpy, expectedRequestResponse;
  
      before(function(done) {
        startTheGame();
        spyOnNotifyViewer();
        setupTestFixtures();
        
        var oldHandle = gameWorld.handleTankActionRequest.bind(gameWorld);
        defendingTank.setHealth(0);
        defendingTank.setRecentlyDied(false);

        gameWorld.handleTankActionRequest = function(actionRequest, onComplete) {
          oldHandle(actionRequest, onComplete);
          gameWorld.handleTankActionRequest = oldHandle.bind(gameWorld);
		      gameWorld.scheduleTankRespawn(defendingTank);
          var respawnTotalDelay = GameWorld.delayTime.respawnDelay+GameWorld.delayTime.beforeMove+GameWorld.delayTime.afterMove;
          clock.tick(respawnTotalDelay);
        }.bind(gameWorld);
        
        requestSpy = Sinon.spy();
        makeActionRequest(
          'defendingTank',
          ActionType.MOVE,
          { direction: Direction.SOUTH },
          function(err, res, body) {
            requestSpy(err, res, body);
            done();
          }
        );
      });
  
      function spyOnNotifyViewer() {
        notifyViewerSpy = Sinon.spy();
        server.notifyViewer = notifyViewerSpy;
      };
  
      function setupTestFixtures() {
        var rand = Math.random();
        defendingTank = new Tank('defendingTank', ('Defender '+rand), { x: 1, y: 1 }, 'blue', 10);
        gameWorld.getMap().addTank(defendingTank);
        
        expectedRequestResponse = ActionRequestResponse.createFrom({
          tankId_: defendingTank.getId(),
          type_: ActionType.MOVE,
          data_: { 
            result: MoveResult.MOVED,
            direction: 2,
            status: {
              health: 100,
              points: 0,
              ammo:   10
            }
          }
        });
      };
  
      after(function() {
        endTheGame();
      });
  
      it('it should have its next action run after it respawns', function() {
        requestSpy.should.have.been.calledOnce;    
        var resStatusCode = requestSpy.getCall(0).args[1].statusCode;
        var body = requestSpy.getCall(0).args[2];

        resStatusCode.should.eql(200);

        (JSON.stringify(body)).should.eql(JSON.stringify(expectedRequestResponse));
        
        var tank = server.getTank(defendingTank.getId());
        tank.getHealth().should.eql(100);
        tank.getAmmo().should.eql(10);
        tank.getPosition().should.eql({x: 1, y: 2});
        tank.hasQueuedAction().should.eql(false);
        tank.hasRecentlyDied().should.eql(false);
      });
  
    });
    
  
  function startTheGame() {
  	server = new HttpServer('localhost','9999','MapData.js');
    server.initialise();
    server.initialiseGame();
    baseServerUrl = 'http://' + server.SERVER_IP + ':' + server.SERVER_PORT;
    gameWorld = server.gameWorld;
    gameWorld.startGame({map_: 0, ammo_: 10});
  };
  
  function endTheGame() {
	gameWorld.endGame();
	server.close();
  };

  function makeActionRequest(tankId, action, actionData, onResponseCallback) {
    var requestUrl = '/tank/'+tankId+'/action';
    var actionObject = { tankId_: tankId, type_: action, data_: actionData };
    var requestOptions = {
      method: 'POST',
      url: baseServerUrl+requestUrl,
      json: actionObject
    };
    HttpRequest(requestOptions, onResponseCallback);
  };
});