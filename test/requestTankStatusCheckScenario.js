var HttpServer = require('../server/HttpServer.js');

var ActionType = require('../game/ActionType.js');
var ActionRequestResponse = require('../game/ActionRequestResponse.js');
var AttackResult = require('../game/AttackResult.js');
var MoveResult = require('../game/MoveResult.js');
var Direction = require('../game/Direction.js');
var EntityType = require('../game/EntityType.js');
var Tank = require('../game/Tank.js');

var HttpRequest = require('request');

var Chai = require('chai');
var should = Chai.should();
Chai.Assertion.includeStack = true;
var Sinon = require('sinon');
var SinonChai = require('sinon-chai');
Chai.use(SinonChai);

describe('Scenario:', function() {
  describe('Post a request to make an action i should always get the status of the tank back.', function() {
    describe('Given I have a server that has a map.', function() {
      var server, baseServerUrl,
          notifyViewerSpy, originalNotifyViewer;

      before(function() {
        setupServer();
      });

      function setupServer() {
        startAServer();
        server.setActionDelaysToZero();
        createNotifyViewerSpy();
      }

      function startAServer() {
        server = new HttpServer();
        server.initialise();
        server.gameWorld.startGame({map_: 0, ammo_: 10});
        getServerUrl();
      }

      function getServerUrl() {
        baseServerUrl = 'http://' + server.SERVER_IP + ':' + server.SERVER_PORT;
      }

      after(function(done) {
        tearDownServer(done);
      });

      function tearDownServer(onFinishedCallback) {
        server.close(onFinishedCallback);
      }

      describe('When I make a move action request.', function() {
        var checkingTank, statusResponseSpy, expectedRequestResponse, expectedViewerRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          makeMoveRequest(done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          checkingTank = new Tank('checkingTank', 'Checker', { x: 1, y: 1 }, 'blue', 10);
          checkingTank.setHealth(30);
          checkingTank.setScore(50);
          server.gameWorld.getMap().addTank(checkingTank);
        }

        function createExpectedRequestResponse() {
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: checkingTank.getId(),
            type_: ActionType.MOVE,
            data_: {
              result: MoveResult.MOVED,
              direction: Direction.SOUTH,
              status: {
                health: checkingTank.getHealth(),
                points: checkingTank.getScore(),
                ammo: checkingTank.getAmmo()
              }
            }
          });
        }

        function makeMoveRequest(done) {
          statusResponseSpy = Sinon.spy();
          var requestUrl = '/tank/'+checkingTank.getId()+'/action';
          var actionObject = { tankId_: checkingTank.getId(), type_: ActionType.MOVE, data_: { direction: Direction.SOUTH } };
          var requestOptions = {
            method: 'POST',
            url: baseServerUrl+requestUrl,
            json: actionObject
          };
          HttpRequest(requestOptions, function(err, res, body) {
            statusResponseSpy(err, res, body);
            done();
          });
        }

        it('Should return the tanks current health and points', function() {
          statusResponseSpy.should.have.been.calledOnce;
          var statusResponse = ActionRequestResponse.createFrom(statusResponseSpy.getCall(0).args[2]);
          statusResponse.should.deep.eql(expectedRequestResponse);
        });

        after(function() {
          restoreNotifyViewer();
          reinitialiseGame();
        });
      });

      describe('When I make a attack action request and it misses.', function() {
        var checkingTank, statusResponseSpy, expectedRequestResponse, expectedViewerRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          makeAttackRequest(done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          checkingTank = new Tank('checkingTank', 'Checker', { x: 1, y: 1 }, 'blue', 10);
          checkingTank.setHealth(30);
          checkingTank.setScore(50);
          server.gameWorld.getMap().addTank(checkingTank);
        }

        function createExpectedRequestResponse() {
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: checkingTank.getId(),
            type_: ActionType.ATTACK,
            data_: {
              result: AttackResult.MISS,
              direction: Direction.SOUTH,
              strikeLocation: [1,8],
              points: 0,
              damage: 0,
              status: {
                health: checkingTank.getHealth(),
                points: checkingTank.getScore(),
                ammo: 9
              }
            }
          });
        }

        function makeAttackRequest(done) {
          statusResponseSpy = Sinon.spy();
          var requestUrl = '/tank/'+checkingTank.getId()+'/action';
          var actionObject = { tankId_: checkingTank.getId(), type_: ActionType.ATTACK, data_: { direction: Direction.SOUTH } };
          var requestOptions = {
            method: 'POST',
            url: baseServerUrl+requestUrl,
            json: actionObject
          };
          HttpRequest(requestOptions, function(err, res, body) {
            statusResponseSpy(err, res, body);
            done();
          });
        }

        it('Should return the tanks current health and points', function() {
          statusResponseSpy.should.have.been.calledOnce;
          var statusResponse = ActionRequestResponse.createFrom(statusResponseSpy.getCall(0).args[2]);
          statusResponse.should.deep.eql(expectedRequestResponse);
        });

        after(function() {
          restoreNotifyViewer();
          reinitialiseGame();
        });
      });

      describe('When I make a attack action request and it hits.', function() {
        var checkingTank, hitTank, statusResponseSpy, expectedRequestResponse, expectedViewerRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          makeAttackRequest(done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          checkingTank = new Tank('checkingTank', 'Checker', { x: 1, y: 1 }, 'blue', 10);
          hitTank = new Tank('hitTank', 'HitTank', { x: 1, y: 4 }, 'red', 10);
          checkingTank.setHealth(30);
          checkingTank.setScore(50);
          server.gameWorld.getMap().addTank(checkingTank);
          server.gameWorld.getMap().addTank(hitTank);
        }

        function createExpectedRequestResponse() {
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: checkingTank.getId(),
            type_: ActionType.ATTACK,
            data_: {
              result: AttackResult.HIT,
              direction: Direction.SOUTH,
              points: 10,
              damage: 10,
              status: {
                health: checkingTank.getHealth(),
                points: checkingTank.getScore()+10,
                ammo: 9
              }
            }
          });
        }

        function makeAttackRequest(done) {
          statusResponseSpy = Sinon.spy();
          var requestUrl = '/tank/'+checkingTank.getId()+'/action';
          var actionObject = { tankId_: checkingTank.getId(), type_: ActionType.ATTACK, data_: { direction: Direction.SOUTH } };
          var requestOptions = {
            method: 'POST',
            url: baseServerUrl+requestUrl,
            json: actionObject
          };
          HttpRequest(requestOptions, function(err, res, body) {
            statusResponseSpy(err, res, body);
            done();
          });
        }

        it('Should return the tanks current health and points', function() {
          statusResponseSpy.should.have.been.calledOnce;
          var statusResponse = ActionRequestResponse.createFrom(statusResponseSpy.getCall(0).args[2]);
          statusResponse.should.deep.eql(expectedRequestResponse);
        });

        after(function() {
          restoreNotifyViewer();
          reinitialiseGame();
        });
      });

      describe('When I make a scan action request.', function() {
        var checkingTank, statusResponseSpy, expectedRequestResponse, expectedViewerRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          makeAttackRequest(done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          checkingTank = new Tank('checkingTank', 'Checker', { x: 2, y: 1 }, 'blue', 10);
          checkingTank.setHealth(30);
          checkingTank.setScore(50);
          server.gameWorld.getMap().addTank(checkingTank);
        }

        function createExpectedRequestResponse() {
          var scanResult = [];
          scanResult[Direction.NORTH] = { entityType: EntityType.WALL, distance: 0, direction: Direction.NORTH };
          scanResult[Direction.EAST] = { entityType: EntityType.WALL, distance: 5, direction: Direction.EAST };
          scanResult[Direction.SOUTH] = { entityType: EntityType.WALL, distance: 6, direction: Direction.SOUTH };
          scanResult[Direction.WEST] = { entityType: EntityType.WALL, distance: 1, direction: Direction.WEST };
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: checkingTank.getId(),
            type_: ActionType.SCAN,
            data_: {
              result: scanResult,
              status: {
                health: checkingTank.getHealth(),
                points: checkingTank.getScore(),
                ammo:   checkingTank.getAmmo()
              }
            }
          });
        }

        function makeAttackRequest(done) {
          statusResponseSpy = Sinon.spy();
          var requestUrl = '/tank/'+checkingTank.getId()+'/action';
          var actionObject = { tankId_: checkingTank.getId(), type_: ActionType.SCAN, data_: {} };
          var requestOptions = {
            method: 'POST',
            url: baseServerUrl+requestUrl,
            json: actionObject
          };
          HttpRequest(requestOptions, function(err, res, body) {
            statusResponseSpy(err, res, body);
            done();
          });
        }

        it('Should return the tanks current health and points', function() {
          statusResponseSpy.should.have.been.calledOnce;
          var statusResponse = ActionRequestResponse.createFrom(statusResponseSpy.getCall(0).args[2]);
          statusResponse.should.deep.eql(expectedRequestResponse);
        });

        after(function() {
          restoreNotifyViewer();
          reinitialiseGame();
        });
      });

      function createNotifyViewerSpy() {
        notifyViewerSpy = Sinon.spy();
        originalNotifyViewer = server.notifyViewer;
        server.notifyViewer = notifyViewerSpy;
      }

      function restoreNotifyViewer() {
        server.notifyViewer = originalNotifyViewer;
      }

      function reinitialiseGame() {
        server.initialiseGame();
        server.setActionDelaysToZero();
        server.gameWorld.startGame({map_: 0, ammo_: 10});
      }
    });
  });
});