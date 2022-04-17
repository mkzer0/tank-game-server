
var HttpServer = require('../server/HttpServer.js');

var Tank = require('../game/Tank.js');
var Target = require('../game/Target.js');
var Direction = require('../game/Direction.js');
var ActionType = require('../game/ActionType.js');
var ActionRequestResponse = require('../game/ActionRequestResponse.js');
var AttackResult = require('../game/AttackResult.js');
var EntityType = require('../game/EntityType.js');

var HttpRequest = require('request');

var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('scenario:', function() {
	describe('Post a request to make an attack action', function() {
		describe('Given I have a server that has a map with a tank', function() {
			var server, baseServerUrl,
			    notifyViewerSpy, attackResponseSpy,
          expectedViewerNotification, expectedRequestResponse;

			before(function() {
				setupServer();
			});

			function setupServer() {
				startAServer();
			};

			function startAServer() {
				server = new HttpServer();
				server.initialise();
				getServerUrl();
			};

			function getServerUrl() {
				baseServerUrl = 'http://' + server.SERVER_IP + ':' + server.SERVER_PORT;
			};

			after(function(done) {
				tearDownServer(done);
			});

			function tearDownServer(onFinishedCallback) {
				server.close(onFinishedCallback);
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

			describe('When I make an attack request without ammunition', function() {
				var attackingTank;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.SOUTH, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 1, y: 1 }, 'blue', 0);
					server.gameWorld.getMap().addTank(attackingTank);
			          expectedRequestResponse = ActionRequestResponse.createFrom({
			            tankId_: attackingTank.getId(),
			            type_: ActionType.ATTACK,
			            data_: {
			              result: AttackResult.OOA,
			              direction: Direction.SOUTH,
                    points: 0,
                    damage: 0,
			              status: {
			                health: 100,
			                points: 0,
			                ammo: 	0
			              }
			            }
			          });
				};

				it('should attribute no points to the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(0);
				});

				it('should not change the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(0);
				});

				it('should return the result of the attack as oom', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.deep.eql(expectedRequestResponse);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedRequestResponse);
				});
			});


			describe('When I make an attack request with infinite ammunition', function() {
				var attackingTank;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.SOUTH, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 1, y: 1 }, 'blue', -1);
					server.gameWorld.getMap().addTank(attackingTank);
			          expectedRequestResponse = ActionRequestResponse.createFrom({
			            tankId_: attackingTank.getId(),
			            type_: ActionType.ATTACK,
			            data_: {
			              result: AttackResult.MISS,
			              direction: Direction.SOUTH,
			              strikeLocation: [1, 8],
                    points: 0,
                    damage: 0,
                    status: {
			                health: 100,
			                points: 0,
			                ammo: 	-1
			              }
			            }
			          });
				};

				it('should attribute no points to the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(0);
				});

				it('should not change the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(-1);
				});

				it('should return the result of the attack as oom', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.deep.eql(expectedRequestResponse);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedRequestResponse);
				});
			});

			describe('When I make an attack request and the attack hits a indestructible object', function() {
				var attackingTank;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.SOUTH, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 1, y: 1 }, 'blue', 10);
					server.gameWorld.getMap().addTank(attackingTank);
			          expectedRequestResponse = ActionRequestResponse.createFrom({
			            tankId_: attackingTank.getId(),
			            type_: ActionType.ATTACK,
			            data_: {
			              result: AttackResult.MISS,
			              direction: Direction.SOUTH,
			              strikeLocation: [1, 8],
                    points: 0,
                    damage: 0,
                    status: {
			                health: 100,
			                points: 0,
			                ammo: 	9
			              }
			            }
			          });
				};

				it('should attribute no points to the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(0);
				});

				it('should decrease the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(9);
				});

				it('should return the result of the attack as a miss', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.deep.eql(expectedRequestResponse);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedRequestResponse);
				});
			});

			describe.skip('When I make an attack request and the attack hits a destroyed target', function() {
				var attackingTank, targetId;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.NORTH, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 9, y: 5 }, 'blue', 10);
					server.gameWorld.getMap().addTank(attackingTank);
					targetId = Target.TargetIds.LEVEL_1_SOUTH
					server.gameWorld.getMap().getTarget(targetId).setStateAsDestroyed();

					expectedRequestResponse = ActionRequestResponse.createFrom({
		            tankId_: attackingTank.getId(),
		            type_: ActionType.ATTACK,
		            data_: {
		              result: AttackResult.MISS,
		              direction: Direction.NORTH,
		              strikeLocation: [9, 2],
                  points: 0,
                  damage: 0,
                  status: {
		                health: 100,
		                points: 0,
		                ammo:   9
		              }
		            }
          		});
				};

				it('should not increase the score of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(0);
				});


				it('should decrease the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(9);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedRequestResponse);
				});

				it('should have responded with the result of the attack to the requester', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.eql(expectedRequestResponse);
				});
			});

			describe('When I make an attack request to attack east and the result is a hit tank', function() {
				var attackingTank, defendingTank;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.EAST, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 1, y: 1 }, 'blue', 10);
					server.gameWorld.getMap().addTank(attackingTank);

					defendingTank = new Tank('defendingTank', 'Defender', { x: 4, y: 1 }, 'green', 10);
					server.gameWorld.getMap().addTank(defendingTank);
					
					expectedViewerNotification = ActionRequestResponse.createFrom({
						tankId_: attackingTank.getId(),
						type_: ActionType.ATTACK,
						data_: { 
							result: AttackResult.HIT,
              direction: Direction.EAST,
							hitEntityId: defendingTank.getId(),
							points: 10,
							damage: 10,
              status: {
                health: 100,
                points: 10,
                ammo: 	9
              }
						}
					});

					expectedRequestResponse = ActionRequestResponse.createFrom({
						tankId_: attackingTank.getId(),
						type_: ActionType.ATTACK,
						data_: { 
							result: AttackResult.HIT,
              direction: Direction.EAST,
							points: 10,
							damage: 10,
							status: {
                health: 100,
                points: 10,
                ammo:   9
              }
						}
					});
				};

				it('should apply damage to the tank that was hit', function() {
					var healthOfDefendingTank = server.getTank(defendingTank.getId()).getHealth();
					healthOfDefendingTank.should.eql(90);
				});

				it('should increase the score of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(10);
				});

				it('should decrease the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(9);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedViewerNotification);
				});

				it('should have responded with the result of the attack to the requester', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.eql(expectedRequestResponse);
				});
			});



      describe('When I make an attack request to attack east and the result is a destroyed tank', function() {
        var attackingTank, defendingTank;

        before(function(done) {
          spyOnNotifyViewer();
          resetTheServerGameState();
          server.gameWorld.scheduleTankRespawn = Sinon.spy();
          setupTestFixtures();
          spyOnAnAttackRequestFor(attackingTank.getId(), Direction.EAST, done);
        });

        function setupTestFixtures() {
          attackingTank = new Tank('attackingTank', 'Attacker', { x: 1, y: 1 }, 'blue', 10);
          server.gameWorld.getMap().addTank(attackingTank);

          defendingTank = new Tank('defendingTank', 'Defender', { x: 4, y: 1 }, 'green', 10);
          defendingTank.setHealth(10);
          server.gameWorld.getMap().addTank(defendingTank);

          expectedViewerNotification = ActionRequestResponse.createFrom({
            tankId_: attackingTank.getId(),
            type_: ActionType.ATTACK,
            data_: {
              result: AttackResult.DESTROYED,
              direction: Direction.EAST,
              hitEntityId: defendingTank.getId(),
              points: 30,
              damage: 10,
              status: {
                health: 100,
                points: 30,
                ammo: 	9
              }
            }
          });

          expectedRequestResponse = ActionRequestResponse.createFrom({
            tankId_: attackingTank.getId(),
            type_: ActionType.ATTACK,
            data_: {
              result: AttackResult.DESTROYED,
              direction: Direction.EAST,
              points: 30,
              damage: 10,
              status: {
                health: 100,
                points: 30,
                ammo: 	9
              }
            }
          });
        };

        it('should apply damage to the tank that was hit', function() {
          var healthOfDefendingTank = server.getTank(defendingTank.getId()).getHealth();
          healthOfDefendingTank.should.eql(0);
        });

        it('should increase the score of the tank that made the attack', function() {
          var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
          scoreOfAttackingTank.should.eql(30);
        });


		it('should decrease the ammunition of the tank that made the attack', function() {
			var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
			scoreOfAttackingTank.should.eql(9);
		});

        it('should notify the viewerClient of the result', function() {
          notifyViewerSpy.should.have.been.calledOnce;
          notifyViewerSpy.should.have.been.calledWith(expectedViewerNotification);
        });

        it('should have responded with the result of the attack to the requester', function() {
          attackResponseSpy.should.have.been.calledOnce;
          var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
          attackRequestResponseBody.should.eql(expectedRequestResponse);
        });

        it('should have scheduled the destroyed tanks respawn', function() {
          server.gameWorld.scheduleTankRespawn.should.have.been.calledOnce;
          server.gameWorld.scheduleTankRespawn.should.have.been.calledWith(defendingTank);
        });

        it('should no longer be in the map', function() {
          server.gameWorld.getMap().getEntityAt(defendingTank.getPosition()).should.not.deep.eql({
            entityType: EntityType.TANK,
            entity: defendingTank
          });
        });
      });

			describe.skip('When I make an attack request to attack east and the result is a destroyed target', function() {
				var attackingTank, targetId;

				before(function(done) {
					spyOnNotifyViewer();
					resetTheServerGameState();
					setupTestFixtures();
					spyOnAnAttackRequestFor(attackingTank.getId(), Direction.NORTH, done);
				});

				function setupTestFixtures() {
					attackingTank = new Tank('attackingTank', 'Attacker', { x: 9, y: 5 }, 'blue', 10);
					server.gameWorld.getMap().addTank(attackingTank);
					targetId = Target.TargetIds.LEVEL_1_SOUTH

					expectedViewerNotification = ActionRequestResponse.createFrom({
						tankId_: attackingTank.getId(),
						type_: ActionType.ATTACK,
						data_: { 
							result: AttackResult.HIT,
							direction: Direction.NORTH,
							hitEntityId: targetId,
							points: 5,
							status: {
								health: 100,
								points: 5,
								ammo: 	9
							}
						}
					});

					expectedRequestResponse = ActionRequestResponse.createFrom({
						tankId_: attackingTank.getId(),
						type_: ActionType.ATTACK,
						data_: { 
							result: AttackResult.HIT,
             				direction: Direction.NORTH,
							points: 5,
							status: {
								health: 100,
								points: 5,
								ammo: 	9
							}
						}
					});
				};

				it('should mark the hit target as destroyed', function() {
					var target = server.gameWorld.getMap().getTarget(targetId);
					expect(target.isDestroyed()).to.eql(true);
				});

				it('should increase the score of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getScore();
					scoreOfAttackingTank.should.eql(5);
				});


				it('should decrease the ammunition of the tank that made the attack', function() {
					var scoreOfAttackingTank = server.getTank(attackingTank.getId()).getAmmo();
					scoreOfAttackingTank.should.eql(9);
				});

				it('should notify the viewerClient of the result', function() {
					notifyViewerSpy.should.have.been.calledOnce;
					notifyViewerSpy.should.have.been.calledWith(expectedViewerNotification);
				});

				it('should have responded with the result of the attack to the requester', function() {
					attackResponseSpy.should.have.been.calledOnce;
					var attackRequestResponseBody = ActionRequestResponse.createFrom(attackResponseSpy.getCall(0).args[2]);
					attackRequestResponseBody.should.eql(expectedRequestResponse);
				});
			});

			function spyOnNotifyViewer() {
				notifyViewerSpy = Sinon.spy();
				server.notifyViewer = notifyViewerSpy;
			};

			function resetTheServerGameState() {
				server.initialiseGame();
       	server.setActionDelaysToZero();
        server.gameWorld.startGame({map_: 0, ammo_: 10});
			};

			function spyOnAnAttackRequestFor(tankId, attackDirection, done) {
				attackResponseSpy = Sinon.spy();
				makeActionRequest(tankId, ActionType.ATTACK, { direction: attackDirection },
				function(err, res, body) {
					attackResponseSpy(err, res, body);
					done();
				});
			};
		});
	});
});