
var GameWorld = require('../../game/GameWorld.js');
var ActionType = require('../../game/ActionType.js');
var ActionRequestResponse = require('../../game/ActionRequestResponse.js');
var AttackResult = require('../../game/AttackResult.js');
var MoveResult = require('../../game/MoveResult.js');
var Direction = require('../../game/Direction.js');
var EntityType = require('../../game/EntityType.js');
var Tank = require('../../game/Tank.js');
var HttpServer = require('../../server/HttpServer.js');
var ControlResult = require('../../game/ControlResult.js');
var ErrorType = require('../../game/ErrorType.js');

var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('GameWorld:', function() {

  describe('Given that I have a GameWorld that has a tank.', function() {
    var gameWorld, tank, expectedTank,
        clock, scheduleActionSpy, onCompleteSpy;

    var MAP_DATA_LOCATION = 'MapData.js';
    var mockRequestData = {data_: {colour_: Tank.Colours.BLUE}};

    describe('startGame() and endGame()', function() {
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        gameWorld = new GameWorld(null, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
      });

      it('should start the game', function() {
        var result = gameWorld.startGame({mapId_: 0, ammo_: 10});
        result.should.eql(ControlResult.GAME_STARTED);
        gameWorld.getGameTimer().should.not.eql(null);
      });

      it('Should return an error when the game has already been started.', function() {
        var expectedError = new Error('Game has already been started.');
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.GAME_IN_PROGRESS;

        gameWorld.startGame({mapId_: 0, ammo_: 10});
        var result = gameWorld.startGame({mapId_: 0, ammo_: 10});
        result.should.include(expectedError);
      });

      it('should clear the game', function() {
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        gameWorld.getGameTimer().should.not.eql(null);
        gameWorld.endGame();
        expect(gameWorld.getGameTimer()).to.eql(null);
      });

      it('should clear the game state and its tanks.', function() {
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        gameWorld.getGameTimer().should.not.eql(null);
        gameWorld.endGame();
        expect(gameWorld.getGameTimer()).to.eql(null);
      });

      it('Should return an error when the game has already been started.', function() {
        var expectedError = new Error('No game is currently in progress.');
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.GAME_NOT_IN_PROGRESS;

        var result = gameWorld.endGame();
        result.should.include(expectedError);
      });
    });

    describe('while the game timer is not running', function() {
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        gameWorld = new GameWorld(null, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
      });

      it('should reject all tank requests', function() {
        (gameWorld.handleTankRequest.bind(gameWorld)).should.throw(
            'The game is not in progress, rejecting all requests until a game has started.');
      });

      it('should reject all action requests', function() {
        var expectedError = new Error('The game is not in progress, rejecting all requests until a game has started.');
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.GAME_NOT_IN_PROGRESS;

        gameWorld.handleTankActionRequest(null, function(err) {
          //err.should.eql(expectedError);
          err.statusCode.should.eql(expectedError.statusCode);
          err.type.should.eql(expectedError.type);
          err.message.should.eql(expectedError.message);
        });
      });
    });

    describe('handleTankActionRequest(actionRequest)', function() {
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        gameWorld = new GameWorld(null, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tank = gameWorld.handleTankRequest(mockRequestData).clientResponse.getData();
        expectedTank = new Tank(tank.getId(), tank.getName(), {x:1, y:2}, tank.getColour(), tank.getAmmo());
        onCompleteSpy = Sinon.spy();
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
        gameWorld.endGame();
      });

      it('should delay an move action by delayTime.beforeMove ms before executing.', function() {
        var processMoveActionSpy = Sinon.spy(gameWorld, 'processMoveAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.MOVE, { direction: Direction.SOUTH } );
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        processMoveActionSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.beforeMove);
        processMoveActionSpy.should.have.been.called;
        processMoveActionSpy.should.have.been.calledWith(tank, actionRequest);
      });

      it('should delay the response of a move action by delayTime.afterMove ms before executing.', function() {
        var processMoveActionSpy = Sinon.spy(gameWorld, 'processMoveAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.MOVE, { direction: Direction.SOUTH } );
        var expectedActionResult = new ActionRequestResponse(
            tank.getId(), ActionType.MOVE, { result: MoveResult.MOVED, direction: Direction.SOUTH, status: { health: 100, points: 0, ammo: 10 } } );

        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        onCompleteSpy.should.not.have.been.called;
        processMoveActionSpy.should.not.have.been.called;

        clock.tick(GameWorld.delayTime.beforeMove);
        processMoveActionSpy.should.have.been.called;
        processMoveActionSpy.should.have.been.calledWith(tank, actionRequest);
        onCompleteSpy.should.not.have.been.called;

        clock.tick(GameWorld.delayTime.afterMove);
        onCompleteSpy.should.have.been.called;
        onCompleteSpy.should.have.been.calledWith({
          viewerNotification: expectedActionResult,
          clientResponse: expectedActionResult
        });
      });

      it('should delay an attack action by delayTime.beforeAttack ms before executing.', function() {
        var processAttackActionSpy = new Sinon.spy(gameWorld, 'processAttackAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.ATTACK, { direction: Direction.SOUTH } );
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        processAttackActionSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.beforeAttack);
        processAttackActionSpy.should.have.been.called;
        processAttackActionSpy.should.have.been.calledWith(tank, actionRequest);
      });

      it('should delay the response of a attack action by delayTime.afterAttack ms.', function() {
        var processAttackActionSpy = new Sinon.spy(gameWorld, 'processAttackAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.ATTACK, { direction: Direction.SOUTH } );
        var expectedActionResult = new ActionRequestResponse(
            tank.getId(), ActionType.ATTACK, {
              result: AttackResult.MISS,
              direction: Direction.SOUTH,
              strikeLocation: [1, 8],
              points: 0,
              damage: 0,
              status: {
                health: 100,
                points: 0,
                ammo: 9
              }
            });
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        onCompleteSpy.should.not.have.been.called;
        processAttackActionSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.beforeAttack);
        processAttackActionSpy.should.have.been.called;
        processAttackActionSpy.should.have.been.calledWith(tank, actionRequest);
        onCompleteSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.afterAttack);
        onCompleteSpy.should.have.been.called;
        onCompleteSpy.should.have.been.calledWith({
          viewerNotification: expectedActionResult,
          clientResponse: expectedActionResult
        });
      });

      it('should delay an scan action by delayTime.beforeScan ms before executing.', function() {
        var processScanActionSpy = new Sinon.spy(gameWorld, 'processScanAction');
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
          processScanActionSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.beforeScan);
        processScanActionSpy.should.have.been.called;
        processScanActionSpy.should.have.been.calledWith(tank);
      });

      it('should delay the response of a scan action by delayTime.afterScan ms.', function() {
        var processScanActionSpy = new Sinon.spy(gameWorld, 'processScanAction');
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        var scanResult = [];
        scanResult[Direction.NORTH] = { entityType: EntityType.WALL, distance: 0, direction: Direction.NORTH };
        scanResult[Direction.EAST] = { entityType: EntityType.WALL, distance: 6, direction: Direction.EAST };
        scanResult[Direction.SOUTH] = { entityType: EntityType.WALL, distance: 6, direction: Direction.SOUTH };
        scanResult[Direction.WEST] = { entityType: EntityType.WALL, distance: 0, direction: Direction.WEST };
        var expectedActionResult = ActionRequestResponse.createFrom({
          tankId_: tank.getId(),
          type_: ActionType.SCAN,
          data_: {
            result: scanResult,
            status: {
              health: tank.getHealth(),
              points: tank.getScore(),
              ammo: tank.getAmmo()
            }
          }
        });
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        onCompleteSpy.should.not.have.been.called;
        processScanActionSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.beforeScan);
        processScanActionSpy.should.have.been.called;
        processScanActionSpy.should.have.been.calledWith(tank);
        onCompleteSpy.should.not.have.been.called;
        clock.tick(GameWorld.delayTime.afterScan);
        onCompleteSpy.should.have.been.called;
        onCompleteSpy.should.have.been.calledWith({
          viewerNotification: expectedActionResult,
          clientResponse: expectedActionResult
        });
      });

      it('should throw an error if a tank has already made a request and it has not yet finished!', function() {
        var errorSpy = Sinon.spy();
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        var expectedError = new Error('Your tank is still performing another action.');
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.ALREADY_SCHEDULED_ACTION;
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        gameWorld.handleTankActionRequest(actionRequest, errorSpy);

        errorSpy.should.have.been.called;
        errorSpy.should.have.been.calledWithMatch({
          statusCode: expectedError.statusCode,
          type: expectedError.type,
          message: expectedError.message
        });
      });

      it('when a move action is scheduled but the game is ended it should not execute', function() {
        var processMoveActionSpy = Sinon.spy(gameWorld, 'processMoveAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.MOVE, { direction: Direction.SOUTH } );
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        processMoveActionSpy.should.not.have.been.called;
        gameWorld.endGame();
        clock.tick(GameWorld.delayTime.beforeMove);
        processMoveActionSpy.should.not.have.been.called;
        onCompleteSpy.should.have.been.calledOnce;
        var errorResponse = new Error('The game is not in progress, rejecting all requests until a game has started.');
        errorResponse.statusCode = 403;
        errorResponse.type = ErrorType.GAME_NOT_IN_PROGRESS;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: errorResponse.statusCode,
          type: errorResponse.type,
          message: errorResponse.message
        });
      });

      it('when an attack action is scheduled but the game is ended it should not execute', function() {
        var processAttackActionSpy = new Sinon.spy(gameWorld, 'processAttackAction');
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.ATTACK, { direction: Direction.SOUTH } );
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        processAttackActionSpy.should.not.have.been.called;
        gameWorld.endGame();
        clock.tick(GameWorld.delayTime.beforeAttack);
        processAttackActionSpy.should.not.have.been.called;
        onCompleteSpy.should.have.been.calledOnce;
        var errorResponse = new Error('The game is not in progress, rejecting all requests until a game has started.');
        errorResponse.statusCode = 403;
        errorResponse.type = ErrorType.GAME_NOT_IN_PROGRESS;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: errorResponse.statusCode,
          type: errorResponse.type,
          message: errorResponse.message
        });
      });


      it('when an scan action is scheduled but the game is ended it should not execute', function() {
        var processScanActionSpy = new Sinon.spy(gameWorld, 'processScanAction');
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        scheduleActionSpy.should.have.been.called;
        processScanActionSpy.should.not.have.been.called;
        gameWorld.endGame();
        clock.tick(GameWorld.delayTime.beforeScan);
        processScanActionSpy.should.not.have.been.called;
        onCompleteSpy.should.have.been.calledOnce;
        var errorResponse = new Error('The game is not in progress, rejecting all requests until a game has started.');
        errorResponse.statusCode = 403;
        errorResponse.type = ErrorType.GAME_NOT_IN_PROGRESS;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: errorResponse.statusCode,
          type: errorResponse.type,
          message: errorResponse.message
        });
      });
    });

    describe('when a tank with zero hit points makes a request', function() {
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        gameWorld = new GameWorld(null, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tank = gameWorld.handleTankRequest(mockRequestData).clientResponse.getData();
        onCompleteSpy = Sinon.spy();
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
        gameWorld.endGame();
      });

      it('should return an error saying that it can not act.', function() {
        var errorMessage = 'Your tank is destroyed, your next request will be scheduled for execution on respawn.';
        var expectedError = new Error(errorMessage);
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.HAS_DIED
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tank.setHealth(0);
        tank.setRecentlyDied(true);
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        onCompleteSpy.should.have.been.calledOnce;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: expectedError.statusCode,
          type: expectedError.type,
          message: expectedError.message
        });
      });
    });

    describe('when a tank with zero hit points has a request scheduled', function() {
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        gameWorld = new GameWorld(null, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tank = gameWorld.handleTankRequest(mockRequestData).clientResponse.getData();
        onCompleteSpy = Sinon.spy();
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
        gameWorld.endGame();
      });

      it('should not execute the scan request and return an error.', function() {
        var errorMessage = 'Your tank is destroyed, your next request will be scheduled for execution on respawn.';
        var expectedError = new Error(errorMessage);
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.HAS_DIED;
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        var actionRequest = new ActionRequestResponse(tank.getId(), ActionType.SCAN, {});
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        tank.setHealth(0);
        tank.setRecentlyDied(true);
        clock.tick(GameWorld.delayTime.beforeScan);
        onCompleteSpy.should.have.been.calledOnce;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: expectedError.statusCode,
          type: expectedError.type,
          message: expectedError.message
        });
      });

      it('should not execute the attack request and return an error.', function() {
        var errorMessage = 'Your tank is destroyed, your next request will be scheduled for execution on respawn.';
        var expectedError = new Error(errorMessage);
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.HAS_DIED;
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.ATTACK, { direction: Direction.SOUTH });
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        tank.setHealth(0);
        tank.setRecentlyDied(true);
        clock.tick(GameWorld.delayTime.beforeAttack);
        onCompleteSpy.should.have.been.calledOnce;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: expectedError.statusCode,
          type: expectedError.type,
          message: expectedError.message
        });
      });

      it('should not execute the move request and return an error.', function() {
        var errorMessage = 'Your tank is destroyed, your next request will be scheduled for execution on respawn.';
        var expectedError = new Error(errorMessage);
        expectedError.statusCode = 403;
        expectedError.type = ErrorType.HAS_DIED;
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        var actionRequest = new ActionRequestResponse(
            tank.getId(), ActionType.MOVE, { direction: Direction.SOUTH });
        gameWorld.handleTankActionRequest(actionRequest, onCompleteSpy);
        tank.setHealth(0);
        tank.setRecentlyDied(true);
        clock.tick(GameWorld.delayTime.beforeMove);
        onCompleteSpy.should.have.been.calledOnce;
        onCompleteSpy.should.have.been.calledWithMatch({
          statusCode: expectedError.statusCode,
          type: expectedError.type,
          message: expectedError.message
        });
      });
    });

    describe('scheduleTankRespawn(tank)', function() {
      var serverStub;
      beforeEach(function() {
        clock = Sinon.useFakeTimers();
        serverStub = Sinon.createStubInstance(HttpServer);
        gameWorld = new GameWorld(serverStub, MAP_DATA_LOCATION);
        scheduleActionSpy = Sinon.spy(gameWorld, 'scheduleAction');
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tank = gameWorld.handleTankRequest(mockRequestData).clientResponse.getData();
        onCompleteSpy = Sinon.spy();
      });

      afterEach(function() {
        scheduleActionSpy.restore();
        clock.restore();
        gameWorld.endGame();
      });

      it('should place the dead tank back at its origin after an amount of time and cancel any scheduled tasks for that tank.', function() {
        gameWorld.server.notifyViewer = Sinon.spy();
        var expectedNotification = ActionRequestResponse.createFrom({
          tankId_: tank.getId(),
          type_: ActionType.RESPAWN,
          data_: tank
        });
        tank.setHealth(0);
        tank.setTask(300);
        gameWorld.scheduleTankRespawn(tank);
        clock.tick(GameWorld.delayTime.respawnDelay);
        tank.getHealth().should.eql(100);
        tank.getAmmo().should.eql(10);
        tank.getPosition().should.deep.eql({ x: 1, y: 1 });
        serverStub.notifyViewer.should.have.been.calledOnce;
        serverStub.notifyViewer.should.have.been.calledWith(expectedNotification);
        gameWorld.getMap().getMap()[1][1].should.eql(tank.getId());
        expect(tank.getTask()).to.eql(null);
      });
    });

    describe('bonus scores are allocated based on greatest x or y displacement from center', function() {
      var serverStub;

      function resetGameState() {
        serverStub = Sinon.createStubInstance(HttpServer);
        gameWorld = new GameWorld(serverStub, MAP_DATA_LOCATION);
        gameWorld.startGame({mapId_: 0, ammo_: 10});
      }

      beforeEach(function() {
        resetGameState();
      });

      function assertScoreFor(position, expectedScore) {
        gameWorld.getMap().addTank(new Tank(1, 'markerTank', position, Tank.Colours.BLUE, 0));
        gameWorld.getTankScoreBonus(1).should.eql(expectedScore);
        resetGameState();
      }
	
      it('should give '+GameWorld.scoreBonus[0]+' points to a tank on the center', function() {
        assertScoreFor({x: 10, y: 10}, GameWorld.scoreBonus[0]);
      });

      var displacementPositions1 = [
        {x: 9, y: 9 }, {x: 10,  y: 9 }, {x: 11,  y: 9},
        {x: 9, y: 10 },                 {x: 11, y: 10 },
        {x: 9, y: 11}, {x: 10,  y: 11}, {x: 11, y: 11}];
      it('should give '+GameWorld.scoreBonus[1]+' points to a tank with a displacement of 1', function() {
        for (var index = 0; index < displacementPositions1.length; index++) {
          assertScoreFor(displacementPositions1[index], GameWorld.scoreBonus[1]);
        }
      });

      var displacementPositions2 = [
        {x: 8 , y: 8 }, {x: 9 , y: 8 }, {x: 10 , y: 8 }, {x: 11, y: 8 }, {x: 12, y: 8 },
        {x: 8 , y: 9 },                                                 {x: 12, y: 9 },
        {x: 8 , y: 10 },                                                 {x: 12, y: 10 },
        {x: 8 , y: 11},                                                 {x: 12, y: 11},
        {x: 8 , y: 12}, {x: 9 , y: 12}, {x: 10 , y: 12}, {x: 11, y: 12}, {x: 12, y: 12}];
      it('should give '+GameWorld.scoreBonus[2]+' points to a tank with a displacement of 2', function() {
        for (var index = 0; index < displacementPositions2.length; index++) {
          assertScoreFor(displacementPositions2[index], GameWorld.scoreBonus[2]);
        }
      });

      var displacementPositions3 = [
        {x: 7 , y: 7 }, {x: 8 , y: 7 }, {x: 9 , y: 7 }, {x: 10 , y: 7 }, {x: 11, y: 7 }, {x: 12, y: 7 }, {x: 13, y: 7 },
        {x: 7 , y: 8 },                                                                                 {x: 13, y: 8 },
        {x: 7 , y: 9 },                                                                                 {x: 13, y: 9 },
        {x: 7 , y: 10 },                                                                                 {x: 13, y: 10 },
        {x: 7 , y: 11},                                                                                 {x: 13, y: 11},
        {x: 7 , y: 12},                                                                                 {x: 13, y: 12},
        {x: 7 , y: 13}, {x: 8 , y: 13}, {x: 9 , y: 13}, {x: 10 , y: 13}, {x: 11, y: 13}, {x: 12, y: 13}, {x: 13, y: 13}];
      it('should give '+GameWorld.scoreBonus[3]+' points to a tank with a displacement of 3', function() {
        for (var index = 0; index < displacementPositions3.length; index++) {
          assertScoreFor(displacementPositions3[index], GameWorld.scoreBonus[3]);
        }
      });

      var displacementPositions4 = [{x: 0, y: 0}, {x: 5, y: 3}, {x: 3, y: 5}, {x: 18, y: 18}, {x: 13, y: 15}, {x: 15, y: 13}];
      it('should give '+GameWorld.scoreBonus[4]+' points to a tank with a displacement greater than 3', function() {
        for (var index = 0; index < displacementPositions4.length; index++) {
          assertScoreFor(displacementPositions4[index], GameWorld.scoreBonus[4]);
        }
      });
    });

    describe('When the game ends.', function() {

      before(function() {
        serverStub = Sinon.createStubInstance(HttpServer);
        gameWorld = new GameWorld(serverStub, MAP_DATA_LOCATION);
        gameWorld.startGame({mapId_: 0, ammo_: 10});
        tankConfigurationVertical();
      });

      var tanks = [];

      function tankConfigurationVertical() {
        tanks.push(new Tank(1, 'onTheMark', {x:10, y:10}, Tank.Colours.BLUE, 0));
        tanks[0].scoreIncreasesBy(10);
        tanks.push(new Tank(2, 'closeToTheMark', {x:10, y:9}, Tank.Colours.RED, 0));
        tanks[1].scoreIncreasesBy(20);
        tanks.push(new Tank(3, 'aWayFromTheMark', {x:10, y:12}, Tank.Colours.GREEN, 0));
        tanks[2].scoreIncreasesBy(30);
        tanks.push(new Tank(4, 'wayOffTheMark', {x:10, y:7}, Tank.Colours.YELLOW, 0));
        tanks[3].scoreIncreasesBy(40);
        for (var i = 0; i < tanks.length; i++) {
          gameWorld.getMap().addTank(tanks[i]);
        }
      };

      it('should write the secret adjusted scores to the console for the instructor to see.', function() {
        var oldConsoleLog = console.log;
        var consoleSpy = Sinon.spy();
        console.log = consoleSpy;
        gameWorld.endGame();
        consoleSpy.should.have.been.calledOnce;
        consoleSpy.should.have.been.calledWith(
          '[Secret Adjusted Scores]: ',
          {
            'onTheMark' :       GameWorld.scoreBonus[0]+tanks[0].getScore(),
            'closeToTheMark' :  GameWorld.scoreBonus[1]+tanks[1].getScore(),
            'aWayFromTheMark' : GameWorld.scoreBonus[2]+tanks[2].getScore(),
            'wayOffTheMark' :   GameWorld.scoreBonus[3]+tanks[3].getScore()
          }
        );
        console.log = oldConsoleLog;
      });
    });

    describe('When a tank is requested', function() {
      beforeEach(function() {
        serverStub = Sinon.createStubInstance(HttpServer);
        gameWorld = new GameWorld(serverStub, MAP_DATA_LOCATION);
        gameWorld.startGame({mapId_: 0, ammo_: -1});
      });

      function makeTankRequest(colour) {
        var tankRequest = {
          data_: {
            colour_: colour
          }
        };
        return gameWorld.handleTankRequest(tankRequest).clientResponse.data_;
      }

      describe('for the first time', function() {
        it('should return a brand new tank object position at its origin', function () {
          var expectedTank = new Tank(0, 'RED TEAM', {x: 1, y: 19}, Tank.Colours.RED, -1);

          var tank = makeTankRequest(Tank.Colours.RED);
          expectedTank.id_ = tank.id_;

          tank.should.deep.eql(expectedTank);
        });
      });

      describe('for the second time', function() {
        it('should return the same tank as the first request', function () {
          var firstTank = makeTankRequest(Tank.Colours.RED);
          var secondTank = makeTankRequest(Tank.Colours.RED);

          firstTank.should.deep.eql(secondTank);
        });
      });
    });
  });
});