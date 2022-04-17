
var ViewerClient = require('../../client/ViewerClient.js');

var MapView = require('../../client/MapView.js');
var LeaderboardView = require('../../client/LeaderboardView.js');

var Tank = require('../../game/Tank.js');
var ActionType = require('../../game/ActionType.js');
var AttackResult = require('../../game/AttackResult.js');
var Direction = require('../../game/Direction.js');

var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('ViewerClient', function() {
  describe('notificationRecieved', function() {
    var viewerClient;
    var mapViewStub;
    var leaderboardViewStub;

    beforeEach(function() {
      viewerClient = new ViewerClient();
      createStubsForViewComponents();
    });

    function createStubsForViewComponents() {
      mapViewStub = Sinon.createStubInstance(MapView);
      viewerClient.mapView = mapViewStub;
      leaderboardViewStub = Sinon.createStubInstance(LeaderboardView);
      viewerClient.leaderboardView = leaderboardViewStub;
    }

    it('should create a tank when a actionRequestResponse with type CREATE is received', function() {
      var tank = new Tank('testTankId', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      viewerClient.notificationRecieved({
        tankId_: tank.getId(),
        type_: ActionType.CREATE,
        data_: JSON.parse(JSON.stringify(tank))
      });


      var tankOne = viewerClient.tanks[tank.getId()];
      tankOne.should.be.ok;

      mapViewStub.addTank.should.have.been.calledOnce;
      var theTankAddedToMap = mapViewStub.addTank.getCall(0).args[0];
      theTankAddedToMap.should.deep.eql(tank);
      leaderboardViewStub.addTank.should.have.been.calledOnce;
      var theTankAddedToLeaderboard = leaderboardViewStub.addTank.getCall(0).args[0];
      theTankAddedToLeaderboard.should.deep.eql(tank);
    });

    it('should cause the specified tank to move when a actionRequestResponse with type MOVE is received', function() {
      var tank = new Tank('testTankId', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      var movedTank = new Tank('testTankId', 'bluetank', { x: 0, y: 1 }, 'blue', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(tank)));
      viewerClient.notificationRecieved({
        tankId_: tank.getId(),
        type_: ActionType.MOVE,
        data_: {
          result: MoveResult.MOVED,
          direction: Direction.SOUTH
        }
      });

      var tankOne = viewerClient.tanks[tank.getId()];
      tankOne.should.be.ok;

      tankOne.should.deep.eql(movedTank);
      mapViewStub.animateTankMove.should.have.been.calledOnce;
      mapViewStub.animateTankMove.should.have.been.calledWith('testTankId', Direction.SOUTH);
    });

    it('should cause the specified tank to OOM when a actionRequestResponse with type ATTACK is received - oom', function() {
      var tank = new Tank('testTankId', 'bluetank', { x: 0, y: 0 }, 'blue', 0);
      viewerClient.createATank(JSON.parse(JSON.stringify(tank)));
      viewerClient.notificationRecieved({
        tankId_: tank.getId(),
        type_: ActionType.ATTACK,
        data_: {
          result: AttackResult.OOA,
          direction: Direction.SOUTH,
          status: {
            health: 100,
            points: 0,
            ammo: 0
          }
        }
      });

      var tankOne = viewerClient.tanks[tank.getId()];
      tankOne.should.be.ok;

      tankOne.getAmmo().should.eql(0);

      expect(mapViewStub.animateTankOom).to.exist;
      mapViewStub.animateTankOom.should.be.ok;
      mapViewStub.animateTankOom.should.have.been.calledOnce;
      mapViewStub.animateTankOom.should.have.been.calledWith(tank.getId(), Direction.SOUTH);
    });    

    it('should cause the specified tank to attack when a actionRequestResponse with type ATTACK is received - miss', function() {
      var tank = new Tank('testTankId', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(tank)));
      viewerClient.notificationRecieved({
        tankId_: tank.getId(),
        type_: ActionType.ATTACK,
        data_: {
          result: AttackResult.MISS,
          direction: Direction.SOUTH,
          strikeLocation: [0, 7],
          status: {
            health: 100,
            points: 0,
            ammo: 9
          }
        }
      });

      var tankOne = viewerClient.tanks[tank.getId()];
      tankOne.should.be.ok;

      tankOne.getAmmo().should.eql(9);

      mapViewStub.animateTankAttack.should.have.been.calledOnce;
      mapViewStub.animateTankAttack.should.have.been.calledWith(tank.getId(), Direction.SOUTH, [0, 7]);
    });

    it('should cause the specified tank to attack (with ammo) when a actionRequestResponse with type ATTACK is received - hit', function() {
      var attackingTank = new Tank('attackingTank', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      var defendingTank = new Tank('defendingTank', 'redtank', { x: 0, y: 3 }, 'red', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(attackingTank)));
      viewerClient.createATank(JSON.parse(JSON.stringify(defendingTank)));
      viewerClient.notificationRecieved({
        tankId_: attackingTank.getId(),
        type_: ActionType.ATTACK,
        data_: {
          result: AttackResult.HIT,
          direction: Direction.EAST,
          hitEntityId: defendingTank.getId(),
          points: 10,
          damage: 20,
          status: {
            health: 100,
            points: 10,
            ammo: 9
          }
        }
      });

      var tankOne = viewerClient.tanks[attackingTank.getId()];
      var tankTwo = viewerClient.tanks[defendingTank.getId()];
      tankOne.should.be.ok;
      tankTwo.should.be.ok;

      tankOne.getScore().should.eql(10);
      tankOne.getAmmo().should.eql(9);
      tankOne.getHealth().should.eql(100);

      tankTwo.getScore().should.eql(0);
      tankTwo.getAmmo().should.eql(10);
      tankTwo.getHealth().should.eql(80);

      leaderboardViewStub.updateTank.should.have.been.calledTwice;
      leaderboardViewStub.updateTank.should.have.been.calledWith(attackingTank.getId());
      leaderboardViewStub.updateTank.should.have.been.calledWith(defendingTank.getId());
      mapViewStub.animateTankAttack.should.have.been.calledOnce;
      mapViewStub.animateTankAttack.should.have.been.calledBefore(leaderboardViewStub.updateTank);
      var animateTankAttackArgs = mapViewStub.animateTankAttack.getCall(0).args;
      animateTankAttackArgs.should.deep.eql([attackingTank.getId(), Direction.EAST, [0, 3]]);
    });


    it('should cause the specified tank to attack (with infinite ammo) when a actionRequestResponse with type ATTACK is received - hit', function() {
      var attackingTank = new Tank('attackingTank', 'bluetank', { x: 0, y: 0 }, 'blue', -1);
      var defendingTank = new Tank('defendingTank', 'redtank', { x: 0, y: 3 }, 'red', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(attackingTank)));
      viewerClient.createATank(JSON.parse(JSON.stringify(defendingTank)));
      viewerClient.notificationRecieved({
        tankId_: attackingTank.getId(),
        type_: ActionType.ATTACK,
        data_: {
          result: AttackResult.HIT,
          direction: Direction.EAST,
          hitEntityId: defendingTank.getId(),
          points: 10,
          damage: 20,
          status: {
            health: 100,
            points: 10,
            ammo: -1
          }
        }
      });

      var tankOne = viewerClient.tanks[attackingTank.getId()];
      var tankTwo = viewerClient.tanks[defendingTank.getId()];
      tankOne.should.be.ok;
      tankTwo.should.be.ok;

      tankOne.getScore().should.eql(10);
      tankOne.getAmmo().should.eql(-1);
      tankOne.getHealth().should.eql(100);

      tankTwo.getScore().should.eql(0);
      tankTwo.getAmmo().should.eql(10);
      tankTwo.getHealth().should.eql(80);

      leaderboardViewStub.updateTank.should.have.been.calledTwice;
      leaderboardViewStub.updateTank.should.have.been.calledWith(attackingTank.getId());
      leaderboardViewStub.updateTank.should.have.been.calledWith(defendingTank.getId());
      mapViewStub.animateTankAttack.should.have.been.calledOnce;
      mapViewStub.animateTankAttack.should.have.been.calledBefore(leaderboardViewStub.updateTank);
      var animateTankAttackArgs = mapViewStub.animateTankAttack.getCall(0).args;
      animateTankAttackArgs.should.deep.eql([attackingTank.getId(), Direction.EAST, [0, 3]]);
    });

    it('should cause the scan animation to trigger on the specified tank when an actionRequestResponse with type SCAN is received.', function() {
      var scanningTank = new Tank('attackingTank', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(scanningTank)));
      viewerClient.notificationRecieved({
        tankId_: scanningTank.getId(),
        type_: ActionType.SCAN,
        data_: {
          result: [],
          status: {
            health: 100,
            points: 0,
            ammo: 10
          }
        }
      });
      mapViewStub.animateTankScan.should.have.been.calledOnce;
      var scanningTankId = mapViewStub.animateTankScan.getCall(0).args[0];
      scanningTankId.should.eql(scanningTank.getId());
    });

    it('should cause the dead tank to be removed when a destroyed event is received.', function() {
      var attackingTank = new Tank('attackingTank', 'bluetank', { x: 0, y: 0 }, 'blue', 10);
      var destroyedTank = new Tank('destroyedTank', 'redtank', { x: 3, y: 0 }, 'red', 10);
      viewerClient.createATank(JSON.parse(JSON.stringify(attackingTank)));
      viewerClient.createATank(JSON.parse(JSON.stringify(destroyedTank)));

      var spy = Sinon.spy();
      mapViewStub.removeTank = spy;      
      
      viewerClient.notificationRecieved({
        tankId_: attackingTank.getId(),
        type_: ActionType.ATTACK,
        data_: {
          result: AttackResult.DESTROYED,
          direction: Direction.EAST,
          hitEntityId: destroyedTank.getId(),
          points: 30,
          damage: 100, /* have to fudge the damage, KO hit to simulate real destroy */
          status: {
            health: 100,
            points: 30,
            ammo:   9
          }
        }
      });

      var tankOne = viewerClient.tanks[attackingTank.getId()];
      var tankTwo = viewerClient.tanks[destroyedTank.getId()];
      tankOne.should.be.ok;
      tankTwo.should.be.ok;

      tankOne.getScore().should.eql(30);
      tankOne.getAmmo().should.eql(9);
      tankOne.getHealth().should.eql(100);

      tankTwo.getScore().should.eql(0);
      tankTwo.getAmmo().should.eql(10);
      tankTwo.getHealth().should.eql(0);

      // animateTankAttack should have been called
      mapViewStub.animateTankAttack.should.have.been.calledOnce;

      // leaderboard updates for both tanks should have been called
      leaderboardViewStub.updateTank.should.have.been.calledTwice;
      var updateTankCallOneArgs = leaderboardViewStub.updateTank.getCall(0).args;
      var updateTankCallTwoArgs = leaderboardViewStub.updateTank.getCall(1).args;
      updateTankCallOneArgs.should.deep.eql([attackingTank.getId(), false]);
      updateTankCallTwoArgs.should.deep.eql([destroyedTank.getId(), true]);

      // animateTankDestroy shuold have been called after attack
      mapViewStub.animateTankDestroy.should.have.been.calledAfter(mapViewStub.animateTankAttack);
      mapViewStub.animateTankDestroy.should.have.been.calledOnce;
      mapViewStub.animateTankDestroy.getCall(0).args[0].should.eql(destroyedTank.getId());
      
      expect(mapViewStub.getTankNode(destroyedTank.getId())).to.not.exist;
    });

    it('should emit start and stop events via successive calls to handleStartStopClick()', function() {
      viewerClient.initialise(function() {});
      var emitSpy = Sinon.spy();
      viewerClient.serverConnectionSocket.emit = emitSpy;
      viewerClient.handleStartStopClick({ammo_: 10});
      emitSpy.should.have.been.calledOnce;
      emitSpy.getCall(0).args.should.deep.eql(['start', {ammo_: 10}]);

      emitSpy.should.have.been.calledWith();
      viewerClient.handleStartStopClick();
      emitSpy.should.have.been.calledTwice;

      emitSpy.getCall(1).args.should.deep.eql(['stop', {}]);
      viewerClient.handleStartStopClick();
      emitSpy.should.have.been.calledTwice;
    });
  });
});