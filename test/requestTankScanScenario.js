var HttpServer = require('../server/HttpServer.js');

var ActionType = require('../game/ActionType.js');
var ActionRequestResponse = require('../game/ActionRequestResponse.js');
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
  describe('Post a request to make an scan action.', function() {
    describe('Given I have a server that has a map.', function() {
      var server, baseServerUrl,
          notifyViewerSpy, originalNotifyViewer;

      before(function() {
        setupServer();
      });

      function setupServer() {
        startAServer();
        server.setActionDelaysToZero();
        server.gameWorld.gameTimer = 1;
        createNotifyViewerSpy();
      }

      function startAServer() {
        server = new HttpServer();
        server.initialise();
        server.gameWorld.startGame({map_:0, ammo_: -1});
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

      describe('When I make a scan action request and I can only see walls.', function() {
        var scanningTank, scanResponseSpy, expectedRequestResponse;

        before(function(done) {
          setupTestFixtures();
          scanResponseSpy = makeScanRequest(scanningTank, done);
          createNotifyViewerSpy();
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          scanningTank = new Tank('scanningTank', 'Scanner', { x: 2, y: 1 }, 'blue', 10);
          server.gameWorld.getMap().addTank(scanningTank);
        }

        function createExpectedRequestResponse() {
          var scanResult = [];
          scanResult[Direction.NORTH] = { entityType: EntityType.WALL, distance: 0, direction: Direction.NORTH };
          scanResult[Direction.EAST] = { entityType: EntityType.WALL, distance: 5, direction: Direction.EAST };
          scanResult[Direction.SOUTH] = { entityType: EntityType.WALL, distance: 6, direction: Direction.SOUTH };
          scanResult[Direction.WEST] = { entityType: EntityType.WALL, distance: 1, direction: Direction.WEST };
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: scanningTank.getId(),
            type_: ActionType.SCAN,
            data_: {
              result: scanResult,
              status: {
                health: scanningTank.getHealth(),
                points: scanningTank.getScore(),
                ammo: scanningTank.getAmmo()
              }
            }
          });
        }

        after(function() {
          restoreNotifyViewer();
        })

        it('Should return a result for each direction, returning the distance to the entity and its type.', function() {
          scanResponseSpy.should.have.been.calledOnce;
          var scanResponse = ActionRequestResponse.createFrom(scanResponseSpy.getCall(0).args[2]);
          scanResponse.should.deep.eql(expectedRequestResponse);
        });

        it('Should notify the viewer client of the scan action.', function() {
          notifyViewerSpy.should.have.been.calledOnce;
          var viewerNotification = ActionRequestResponse.createFrom(notifyViewerSpy.getCall(0).args[0]);
          viewerNotification.should.deep.eql(expectedRequestResponse);
        });
      });

      describe('When I make a scan action request and I can see a tank.', function() {
        var scanningTank, detectedTank, scanResponseSpy, expectedRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          scanResponseSpy = makeScanRequest(scanningTank, done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          scanningTank = new Tank('scanningTank', 'Scanner', { x: 2, y: 1 }, 'blue', 10);
          server.gameWorld.getMap().addTank(scanningTank);
          detectedTank = new Tank('detectedTank', 'Detected', { x: 6, y: 1 }, 'green', 10);
          server.gameWorld.getMap().addTank(detectedTank);
        }

        function createExpectedRequestResponse() {
          var scanResult = [];
          scanResult[Direction.NORTH] = { entityType: EntityType.WALL, distance: 0, direction: Direction.NORTH };
          scanResult[Direction.EAST] = {
            entityType: EntityType.TANK,
            distance: 3,
            entityData: {
              health: detectedTank.getHealth(),
              colour: detectedTank.getColour()
            },
            direction: Direction.EAST
          };
          scanResult[Direction.SOUTH] = { entityType: EntityType.WALL, distance: 6, direction: Direction.SOUTH };
          scanResult[Direction.WEST] = { entityType: EntityType.WALL, distance: 1, direction: Direction.WEST };
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: scanningTank.getId(),
            type_: ActionType.SCAN,
            data_: {
              result: scanResult,
              status: {
                health: scanningTank.getHealth(),
                points: scanningTank.getScore(),
                ammo: scanningTank.getAmmo()
              }
            }
          });
        }

        after(function() {
          restoreNotifyViewer();
        })

        it('Should return a result for each direction, specifically returning the detected tanks health and colour.', function() {
          scanResponseSpy.should.have.been.calledOnce;
          var scanResponse = ActionRequestResponse.createFrom(scanResponseSpy.getCall(0).args[2]);
          scanResponse.should.deep.eql(expectedRequestResponse);
        });

        it('Should notify the viewer client of the scan action.', function() {
          notifyViewerSpy.should.have.been.calledOnce;
          var viewerNotification = ActionRequestResponse.createFrom(notifyViewerSpy.getCall(0).args[0]);
          viewerNotification.should.deep.eql(expectedRequestResponse);
        });
      });

      describe.skip('When I make a scan action request and I can see a target.', function() {
        var scanningTank, detectedTank, scanResponseSpy, expectedRequestResponse;

        before(function(done) {
          setupTestFixtures();
          createNotifyViewerSpy();
          scanResponseSpy = makeScanRequest(scanningTank, done);
        });

        function setupTestFixtures() {
          createTheTankOnTheServer();
          createExpectedRequestResponse();
        }

        function createTheTankOnTheServer() {
          scanningTank = new Tank('scanningTank', 'Scanner', { x: 12, y: 13 }, 'blue', 10);
          server.gameWorld.getMap().addTank(scanningTank);
        }

        function createExpectedRequestResponse() {
          var scanResult = [];
          scanResult[Direction.NORTH] = { entityType: EntityType.WALL, distance: 6, direction: Direction.NORTH };
          scanResult[Direction.EAST] = {
            entityType: EntityType.TARGET,
            distance: 1,
            entityData: {
              destroyed: false
            },
            direction: Direction.EAST
          };
          scanResult[Direction.SOUTH] = { entityType: EntityType.WALL, distance: 0, direction: Direction.SOUTH };
          scanResult[Direction.WEST] = { entityType: EntityType.WALL, distance: 5, direction: Direction.WEST };
          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: scanningTank.getId(),
            type_: ActionType.SCAN,
            data_: {
              result: scanResult,
              status: {
                health: scanningTank.getHealth(),
                points: scanningTank.getScore(),
                ammo: scanningTank.getAmmo()
              }
            }
          });
        }

        after(function() {
          restoreNotifyViewer();
        })

        it('Should return a result for each direction, specifically returning the detected tanks health and colour.', function() {
          scanResponseSpy.should.have.been.calledOnce;
          var scanResponse = ActionRequestResponse.createFrom(scanResponseSpy.getCall(0).args[2]);
          scanResponse.should.deep.eql(expectedRequestResponse);
        });

        it('Should notify the viewer client of the scan action.', function() {
          notifyViewerSpy.should.have.been.calledOnce;
          var viewerNotification = ActionRequestResponse.createFrom(notifyViewerSpy.getCall(0).args[0]);
          viewerNotification.should.deep.eql(expectedRequestResponse);
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

      function makeScanRequest(scanningTank, done) {
        var scanResponseSpy = Sinon.spy();
        var requestUrl = '/tank/'+scanningTank.getId()+'/action';
        var actionObject = { tankId_: scanningTank.getId(), type_: ActionType.SCAN };
        var requestOptions = {
          method: 'POST',
          url: baseServerUrl+requestUrl,
          json: actionObject
        };
        HttpRequest(requestOptions, function(err, res, body) {
          scanResponseSpy(err, res, body);
          done();
        });
        return scanResponseSpy;
      }

    });
  });
});