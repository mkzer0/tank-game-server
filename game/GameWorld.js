var Logger = new (require('./Logger.js'))();

var uuid = require('node-uuid');

var ActionRequestResponse = require('./ActionRequestResponse.js');
var ActionType = require('./ActionType.js');
var AttackResult = require('./AttackResult.js');
var Direction = require('./Direction.js');
var EntityType = require('./EntityType.js');
var ErrorType = require('./ErrorType.js');
var Map = require('./Map.js');
var MapData = require('./MapData.js');
var Tank = require('./Tank.js');
var TankColourMapping = require('./TankColourMapping.js');
var ControlResult = require('./ControlResult.js');

var GameWorld = function(httpServer, mapDataLocation) {
  GameWorld.prototype.server = httpServer;
  GameWorld.prototype.mapDataLocation = mapDataLocation;

  var map = null;
  var tankColourMapping = new TankColourMapping(21, 21);
  
  GameWorld.prototype.startGame = function(gameDataResponse) {
    if (this.gameTimer != null) {
      var err = new Error('Game has already been started.');
      err.statusCode = 403;
      err.type = ErrorType.GAME_IN_PROGRESS;
      Logger.log('[GameWorld.startGame]: Game already in progress!');
      return err;
    }

    var gameData = this.handleGameDataResponse(gameDataResponse);
    map = new Map(this.mapDataLocation, gameData.map);

    this.setStartingAmmoCount(gameData.ammo);
    this.setStartingMap(gameData.map);
    
    this.gameTimer = 1;
    Logger.log('[GameWorld.startGame]: Game started.');
    return ControlResult.GAME_STARTED;
  };
  
  GameWorld.prototype.endGame = function() {
    if (this.gameTimer == null) {
      var err = new Error('No game is currently in progress.');
      err.statusCode = 403;
      err.type = ErrorType.GAME_NOT_IN_PROGRESS;
      Logger.log('[GameWorld.endGame]: Game not in progress!');
      return err;
    }
    this.gameTimer = null;

    var secretScores = this.calculateSecretScores();
    console.log('[Secret Adjusted Scores]: ', secretScores);

    Logger.log('[GameWorld.endGame]: Game ended.');
    return ControlResult.GAME_ENDED;
  };

  GameWorld.prototype.calculateSecretScores = function() {
    var tanks = this.getMap().tanks_;
    var tankIds = Object.keys(tanks);
    var secretScores = {};
    for (var index = 0; index < tankIds.length; index++) {
      secretScores[tanks[tankIds[index]].getName()] = this.getTankScoreBonus(tankIds[index]) +
        tanks[tankIds[index]].getScore();
    }
    return secretScores;
  };
  
  GameWorld.prototype.getGameTimer = function() {
    return this.gameTimer;
  };
  
  GameWorld.prototype.getMapData = function() {
    return map.getMap();
  };
  
  GameWorld.prototype.setStartingMap = function(mapId) {
    this.startingMap_ = map.setMapId(mapId);
  };
  
  GameWorld.prototype.getStartingAmmoCount = function() {
    return this.startingAmmo_;
  };
  
  GameWorld.prototype.setStartingAmmoCount = function(ammo) {
    this.startingAmmo_ = ammo;
  };
  
  GameWorld.prototype.handleTankRequest = function(tankRequest) {
    if (this.hasTheGameEnded()) {
      throw this.respondWithError(ErrorType.GAME_NOT_IN_PROGRESS);
    }
    if (!tankColourMapping.isValidColour(tankRequest.data_.colour_)) {
      throw this.respondWithError(ErrorType.INVALID_TANK_COLOUR);
    }

    var response = this.createOrGetTank(tankRequest.data_.colour_);
    if (response.created) {
      map.addTank(response.tank);
      var actionResult =
        new ActionRequestResponse(response.tank.getId(), ActionType.CREATE, response.tank);
      return {
        viewerNotification: actionResult,
        clientResponse: actionResult
      }
    } else {
      var actionResult =
        new ActionRequestResponse(response.tank.getId(), ActionType.CREATE, response.tank);
      return {
        clientResponse: actionResult
      }
    }
  };
  
  GameWorld.prototype.createOrGetTank = function(colour) {
    var properties = tankColourMapping.getTankInitialProperties(colour);
    if (!map.tankExistsWithColour(properties.colour)) {
      return {
        created: true,
        tank: new Tank(
          uuid.v1(),
          properties.name,
          properties.position,
          properties.colour,
          this.getStartingAmmoCount()
        )
      };
    } else {
      return {
        created: false,
        tank: map.getTankWithColour(colour)
      };
    }
  };

  GameWorld.prototype.handleGameDataResponse = function(gameData) {
    return {
      ammo: (gameData.ammo_ <= 0)?-1:gameData.ammo_,
      map: (gameData.map_ >= 0 && gameData.map_ <= 4)?gameData.map_:0
    }
  };
  
  GameWorld.prototype.handleTankActionRequest = function(actionRequest, onComplete) {
    if (this.hasTheGameEnded()) {
      this.respondWithError(ErrorType.GAME_NOT_IN_PROGRESS, onComplete);
      return;
    }

    var tank = map.getTank(actionRequest.getTankId());
    if (this.isTheTankDead(tank)) {
      this.tankDeadHandler(tank, actionRequest, onComplete);
      return;
    }
    
    if (tank.hasTaskScheduled()) {
      this.respondWithError(ErrorType.ALREADY_SCHEDULED_ACTION, onComplete);
      return;
    }
    
    this.scheduleAction(tank, actionRequest, function(actionResult) {
      if (actionResult instanceof Error) {
        onComplete(actionResult);
        return;
      }

      var actionResultAndStatus = ActionRequestResponse.createFrom(actionResult);

      actionResultAndStatus.data_.status = getStatusOfTank(tank);
      tank.clearTask();
      onComplete({
        viewerNotification: actionResult,
        clientResponse: filterResponseData(actionResultAndStatus)
      });
    }.bind(this));
  };
  
  GameWorld.prototype.scheduleAction = function(tank, action, responseCallback) {
    // getTankInitialProperties the before and after delays
    var delayBefore, delayAfter;
    switch(action.getType()) {
      case ActionType.MOVE:
        delayBefore = GameWorld.delayTime.beforeMove;
        delayAfter = GameWorld.delayTime.afterMove;
        break;
      case ActionType.ATTACK:
        delayBefore = GameWorld.delayTime.beforeAttack;
        delayAfter = GameWorld.delayTime.afterAttack;
        break;
      case ActionType.SCAN:
        delayBefore = GameWorld.delayTime.beforeScan;
        delayAfter = GameWorld.delayTime.afterScan;
        break;
      default:
        console.log('[ERROR] ActionType invalid');
    }

    // set the timeout for the function (beforeDelay)
    var taskId = setTimeout(function() {
      if (this.hasTheGameEnded()) {
        this.respondWithError(ErrorType.GAME_NOT_IN_PROGRESS, responseCallback);
      } else if (this.isTheTankDead(tank)) {
        this.tankDeadHandler(tank, action, responseCallback);
      } else {
        var response;
        switch(action.getType()) {
          case ActionType.MOVE:
            response = this.processMoveAction(tank, action);
            break;
          case ActionType.ATTACK:
            response = this.processAttackAction(tank, action);
            break;
          case ActionType.SCAN:
            response = this.processScanAction(tank);
            break;
          default:
            console.log('[ERROR] ActionType invalid');
        }
        delayResponse(tank, response, responseCallback, delayAfter);
      }
    }.bind(this), delayBefore);
    
    tank.setTask(taskId);
  };
  
  GameWorld.prototype.hasTheGameEnded = function() {
    return (this.gameTimer == null);
  };
  
  GameWorld.prototype.isTheTankDead = function(tank) {
    return (tank.getHealth() <= 0);
  };
  
  GameWorld.prototype.tankDeadHandler = function(tank, actionRequest, responseCallback) {
    if (tank.hasRecentlyDied()) {
      tank.setRecentlyDied(false);
      this.respondWithError(ErrorType.HAS_DIED, responseCallback);
    } else {
      tank.queueAction(actionRequest, responseCallback);
    }
  };
  
  GameWorld.prototype.respondWithError = function(errorType, responseCallback) {
    var responseError = new Error(this.getErrorMessage(errorType));
    responseError.statusCode = 403;
		responseError.type = errorType;
    if (responseCallback) {
      responseCallback(responseError);
    } else {
      return responseError;
    }
  };

  GameWorld.prototype.getErrorMessage = function(errorType) {
    switch(errorType) {
      case ErrorType.GAME_NOT_IN_PROGRESS:
        return 'The game is not in progress, rejecting all requests until a game has started.';
      case ErrorType.HAS_DIED:
        return 'Your tank is destroyed, your next request will be scheduled for execution on respawn.';
      case ErrorType.ALREADY_SCHEDULED_ACTION:
        return 'Your tank is still performing another action.';
      case ErrorType.MULTIPLE_TANK_REQUESTS:
        return 'Multiple tank requests made. Back off!';
      case ErrorType.INVALID_TANK_COLOUR:
        return 'An invalid colour was specified.';
    }
  };
  
  var delayResponse = function(tank, response, responseCallback, delayInMiliSeconds) {
    var taskId = setTimeout(function() {
      responseCallback(response);
    }, delayInMiliSeconds);
    tank.setTask(taskId);
  };
  
  GameWorld.prototype.processMoveAction = function(tank, action) {
    var actionResult = map.moveTank(tank, action.getData().direction);
    return ActionRequestResponse.createFrom({
      tankId_: tank.getId(),
      type_: ActionType.MOVE,
      data_: {
        result: actionResult,
        direction: action.getData().direction
      }
    });
  };
  
  GameWorld.prototype.processAttackAction = function(tank, action) {
    var nextEntity = map.getNextEntityFrom(
      tank.getPosition(), action.getData().direction);
    var attackResult = determineAttackResult(tank, nextEntity);
    
    if (attackResult.result == AttackResult.DESTROYED) {
      // if we destroyed a tank, also remove it from the map and
      // schedule its respawn
      map.removeTankFromMap(attackResult.hitEntityId);
      this.scheduleTankRespawn(map.getTank(attackResult.hitEntityId));
    }
    
    var returner = ActionRequestResponse.createFrom({
      tankId_: tank.getId(),
      type_: ActionType.ATTACK,
      data_: attackResult
    });
    return returner;
  };
  
  var determineAttackResult = function(theAttackingTank, hitEntityBearing) {
    var theHitEntity;
    if (!theAttackingTank.hasAmmo()) {
      return {
        result: AttackResult.OOA,
        direction: hitEntityBearing.direction,
        points: 0,
        damage: 0
      }
    }
    theAttackingTank.reduceAmmoBy(1);
    if (hitEntityBearing.entityType == EntityType.TARGET){
      theHitEntity = getTheHitEntity(hitEntityBearing);
      if (!theHitEntity.isDestroyed()) {
        theHitEntity.setStateAsDestroyed();
        theAttackingTank.scoreIncreasesBy(theHitEntity.getValue());
        return {
          result: AttackResult.HIT,
          direction: hitEntityBearing.direction,
          hitEntityId: theHitEntity.getId(),
          points: theHitEntity.getValue()
        };
      }
    } else if (hitEntityBearing.entityType == EntityType.TANK) {
      theHitEntity = getTheHitEntity(hitEntityBearing);
      var damageDone = dealAttackDamage(theHitEntity);
      var pointsAwarded, result;
      if (theHitEntity.getHealth() <= 0) {
        result = AttackResult.DESTROYED;
        pointsAwarded = 30;
      } else {
        result = AttackResult.HIT;
        pointsAwarded = 10;
      }
      theAttackingTank.scoreIncreasesBy(pointsAwarded);
      return {
        result: result,
        direction: hitEntityBearing.direction,
        hitEntityId: theHitEntity.getId(),
        points: pointsAwarded,
        damage: damageDone
      };
    }
    return {
      result: AttackResult.MISS,
      direction: hitEntityBearing.direction,
      strikeLocation: determineStrikeLocation(hitEntityBearing),
      points: 0,
      damage: 0
    };
  };
  
  var dealAttackDamage = function(targetTank) {
    var healthBeforeAttack, healthAfterAttack;
    healthBeforeAttack = targetTank.getHealth();
    targetTank.takesTankAttackDamage();
    healthAfterAttack = targetTank.getHealth();
    return (healthBeforeAttack - healthAfterAttack);
  };
  
  var getTheHitEntity = function(hitEntityBearing) {
    var entityLocation = Map.getPositionFromDistanceAndDirection(
      hitEntityBearing.origin, hitEntityBearing.distance, hitEntityBearing.direction);
    return map.getEntityAt(entityLocation).entity;
  };
  
  var determineStrikeLocation = function(hitEntityBearing) {
    var strikePosition = Map.getPositionFromDistanceAndDirection(
      hitEntityBearing.origin, hitEntityBearing.distance, hitEntityBearing.direction);
    return [strikePosition.x, strikePosition.y];
  };
  
  GameWorld.prototype.scheduleTankRespawn = function(tank) {
    tank.setTask(null);
    tank.setRecentlyDied(true);

    setTimeout(function() {
      switch(tank.getColour()) {
        case Tank.Colours.BLUE:
          tank.setLocation([1, 1]);
          break;
        case Tank.Colours.GREEN:
          tank.setLocation([map.xLimit_-2, 1]);
          break;
        case Tank.Colours.RED:
          tank.setLocation([1, map.yLimit_-2]);
          break;
        case Tank.Colours.YELLOW:
          tank.setLocation([map.xLimit_-2, map.yLimit_-2]);
          break;
      }
      tank.setHealth(100);
      tank.setAmmo(this.getStartingAmmoCount());
      tank.setRecentlyDied(false);
      map.addTank(tank);
      
      this.server.notifyViewer(
        ActionRequestResponse.createFrom({
          tankId_: tank.getId(),
          type_: ActionType.RESPAWN,
          data_: tank
        })
      );

      if (tank.hasQueuedAction()) {
        this.handleTankActionRequest(tank.getQueuedAction().action, tank.getQueuedAction().callback);
        tank.queueAction(null);
      }
      
    }.bind(this), GameWorld.delayTime.respawnDelay);
  };
  
  var filterResponseData = function(actionResult) {
    if (actionResult.getType() == ActionType.ATTACK &&
        (actionResult.getData().result == AttackResult.HIT ||
          actionResult.getData().result == AttackResult.DESTROYED)) {
      var data = actionResult.getData();
      var newData = {
        result: data.result,
        direction: data.direction,
        points: data.points,
        damage: data.damage,
        status: data.status
      };
      return new ActionRequestResponse(
        actionResult.getTankId(), actionResult.getType(), newData);
    } else {
      return actionResult;
    }
  };
  
  GameWorld.prototype.processScanAction = function(tank) {
    var scanResult = [];
    for (var key in Direction) {
      scanResult[Direction[key]] = getScanResultForDirection(tank, Direction[key]);
    }
    var returner = ActionRequestResponse.createFrom({
      tankId_: tank.getId(),
      type_: ActionType.SCAN,
      data_: { result: scanResult }
    });
    return returner;
  };
  
  var getScanResultForDirection = function(tank, direction) {
    var entityBearing = map.getNextEntityFrom(tank.getPosition(), direction);
    var entityPosition = Map.getPositionFromDistanceAndDirection(
      entityBearing.origin, entityBearing.distance, entityBearing.direction);
    if (entityBearing.entityType == EntityType.TANK) {
      var entity = map.getEntityAt(entityPosition).entity;
      return {
        entityType: entityBearing.entityType,
        distance: entityBearing.distance,
        entityData: {
          health: entity.getHealth(),
          colour: entity.getColour()
        },
        direction: direction
      };
    } else if (entityBearing.entityType == EntityType.WALL) {
      return {
        entityType: entityBearing.entityType,
        distance: entityBearing.distance,
        direction: direction
      };
    } else if (entityBearing.entityType == EntityType.TARGET) {
      var entity = map.getEntityAt(entityPosition).entity;
      return {
        entityType: entityBearing.entityType,
        distance: entityBearing.distance,
        entityData: {
          destroyed: entity.isDestroyed()
        },
        direction: direction
      };
    }
  };
  
  var getStatusOfTank = function(tank) {
    return {
      health: tank.getHealth(),
      points: tank.getScore(),
      ammo: tank.getAmmo()
    };
  };
  
  GameWorld.prototype.getMap = function() {
    return map;
  };

  GameWorld.prototype.getTankScoreBonus = function(tankId) {
    var tankDisplacement = this.getMap().calculateTankCenterDisplacement(tankId);
    if (tankDisplacement >= 4) {
      return GameWorld.scoreBonus[4];
    } else {
      return GameWorld.scoreBonus[tankDisplacement];
    }
  };
  
  GameWorld.prototype.gameTimer = null;
};

GameWorld.delayTime = {
  beforeMove: 200,
  afterMove: 300,
  beforeAttack: 500,
  afterAttack: 200,
  beforeScan: 0,
  afterScan: 100,
  respawnDelay: 7000
};

GameWorld.scoreBonus = [500, 100, 20, 4, 0];

module.exports = GameWorld;