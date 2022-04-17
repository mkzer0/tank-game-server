
var HttpServer = require('../server/HttpServer.js');
var ViewerClient = require('../client/ViewerClient.js');
var Direction = require('../game/Direction.js');
var Tank = require('../game/Tank.js');
var ActionType = require('../game/ActionType.js');
var ActionRequestResponse = require('../game/ActionRequestResponse.js');
var MapView = require('../client/MapView.js');
var LeaderboardView = require('../client/LeaderboardView.js');
var GameWorld = require('../game/GameWorld.js');

var HttpRequest = require('request').defaults({ encoding: null });

var Assert = require('assert');
var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('Scenario', function() {
	describe('Move a Tank', function() {
		describe('Given I have a Server and a ViewerClient.', function() {
			var server;
			var baseServerUrl;

			var tankId = 'testId';
			var notifyViewerCalled = false;

			before(function() {
				setupTestServer();
			});

			function setupTestServer() {
				startAServer();
				getServerUrl();
				watchNotifyViewerFunctionOnServer();
			};

			function startAServer() {
				server = new HttpServer();
				server.initialise();
			};

			function getServerUrl() {
				baseServerUrl = 'http://' + server.SERVER_IP + ':' + server.SERVER_PORT;
			};

			function watchNotifyViewerFunctionOnServer() {
				var baseFunction = server.notifyViewer.bind(server);
				server.notifyViewer = function(actionResultData) {
					notifyViewerCalled = true;
					actionResultDataSent = actionResultData;
					baseFunction(actionResultData);
				};
			};

			after(function(done) {
				closeTestServer(done);
			});

			function closeTestServer(callback) {
				server.close(callback);
			};

			function initialiseScenario() {
				setupTestFixtures();
				assertTanksAreInTheInitialState();
			};

			function setupTestFixtures() {
				server.initialiseGame();
        server.setActionDelaysToZero();
        server.gameWorld.startGame({map_: 0, ammo_: -1});
				server.gameWorld.getMap().addTank(new Tank(tankId, "TestTankServer", { x: 2, y: 2 }, "TestColour", 10));
        server.notifyViewer = Sinon.spy();
				notifyViewerCalled = false;
				actionResultDataSent = null;
			};

			function assertTanksAreInTheInitialState() {
				assertTankIsInExpectedPosition(server.getTank(tankId), { x: 2, y: 2 });
			};

			describe('When I make a request to move a tank south.', function() {
				before(initialiseScenario);
				it('it should respond to the request', function(done) {
					makeAMoveRequestForDirection(Direction.SOUTH, assertResponseStatusIs200.bind(done));
				});
				it('then process the move on the server', function() {
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 2, y: 3 });
					assertMapDataUpdated(server.getTank(tankId));
				});
				it('then send the action result to the viewerClient', function() {
					assertViewerClientHasBeenNotifiedCorrectly();
				});
			});

			describe('When I make a request to move a tank north.', function() {
				before(initialiseScenario);
				it('it should respond to the request', function(done) {
					makeAMoveRequestForDirection(Direction.NORTH, assertResponseStatusIs200.bind(done));
				});
				it('then process the move on the server', function() {
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 2, y: 1 });
					assertMapDataUpdated(server.getTank(tankId));
				});
				it('then send the action result to the viewerClient', function() {
					assertViewerClientHasBeenNotifiedCorrectly();
				});
			});

			describe('When I make a request to move a tank east.', function() {
				before(initialiseScenario);
				it('it should respond to the request', function(done) {
					makeAMoveRequestForDirection(Direction.EAST, assertResponseStatusIs200.bind(done));
				});
				it('then process the move on the server', function() {
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 3, y: 2 });
					assertMapDataUpdated(server.getTank(tankId));
				});
				it('then send the action result to the viewerClient', function() {
					assertViewerClientHasBeenNotifiedCorrectly();
				});
			});

			describe('When I make a request to move a tank west.', function() {
				before(initialiseScenario);
				it('it should respond to the request', function(done) {
					makeAMoveRequestForDirection(Direction.WEST, assertResponseStatusIs200.bind(done));
				});
				it('then process the move on the server', function() {
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 1, y: 2 });
					assertMapDataUpdated(server.getTank(tankId));
				});
				it('then send the action result to the viewerClient', function() {
					assertViewerClientHasBeenNotifiedCorrectly();
				});
			});

			describe('When I make a request to move but something blocks the tank from moving.', function() {
				before(function() {
					server.gameWorld.getMap().addTank(new Tank(tankId, "TestTankServer", { x: 1, y: 7 }, "TestColour"), 10);
          server.notifyViewer = Sinon.spy();
					notifyViewerCalled = false;
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 1, y: 7 });
				});
				it('it should respond to the request', function(done) {
					makeAMoveRequestForDirection(Direction.WEST, assertResponseStatusIs200.bind(done));
				});
				it('then process the move on the server', function() {
					assertTankIsInExpectedPosition(server.getTank(tankId), { x: 1, y: 7 });
					assertMapDataUnchanged(server.getTank(tankId), { x: 1, y: 7 });
				});
				it('then send the action result to the viewerClient', function() {
					assertViewerClientHasBeenNotifiedCorrectly();
				});
			});

			function makeAMoveRequestForDirection(moveDirection, onResponseCallback) {
				var requestCommand = '/tank/'+tankId+'/action';
				var actionObject = new ActionRequestResponse(
					tankId, ActionType.MOVE, { direction: moveDirection, status: {health: 100, points: 0, ammo: 10} } );

				var requestOptions = {
					method: 'POST',
					url: baseServerUrl+requestCommand,
					json: actionObject
				};
				HttpRequest(requestOptions, onResponseCallback);
			};

			function assertResponseStatusIs200 (err, res, body) {
				Assert.equal(res.statusCode, 200, 'Response did not have code 200!');
				if (this) this();
			};

			function assertTankIsInExpectedPosition(tank, expectedPosition) {
				var actualTankPosition = tank.getPosition();
				Assert.deepEqual(actualTankPosition, expectedPosition,
					'Position of tank incorrect! Was:'+JSON.stringify(actualTankPosition)+
					' Should be:'+JSON.stringify(expectedPosition));
			};

			function assertMapDataUpdated(tank) {
				var tankPosition = tank.getPosition();
				var mapValueAtTankLocation = server.gameWorld.getMap().getMap()[tankPosition.y][tankPosition.x];
				mapValueAtTankLocation.should.eql(tankId);
				var mapValueAtOldTankLocation = server.gameWorld.getMap().getMap()[2][2];
				mapValueAtOldTankLocation.should.eql(0);
			};

			function assertMapDataUnchanged(tank, expectedPosition) {
				var tankPosition = tank.getPosition();
				tankPosition.should.deep.eql(expectedPosition);
				var mapValueAtTankLocation = server.gameWorld.getMap().getMap()[tankPosition.y][tankPosition.x];
				mapValueAtTankLocation.should.eql(tankId);
			};

			function assertViewerClientHasBeenNotifiedCorrectly() {
				Assert.ok(server.notifyViewer.calledOnce, 'The viewer was not sent a notification!');
			};
		});
	});
});