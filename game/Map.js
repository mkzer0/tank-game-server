
var EntityType = require('./EntityType.js');
var Direction = require('./Direction.js');
var Target = require('./Target.js');
var MoveResult = require('./MoveResult.js');
var Underscore = require('underscore');

var Map = function(mapDataLocation, mapId) {
  console.log(this.tanks_);
	this.data_ = this.getMapData(mapDataLocation);
	this.setMapId(mapId);
	this.initialise();
};

Map.prototype.initialise = function() {
	this.xLimit_ = this.getMap()[0].length;
	this.yLimit_ = this.getMap().length;
	this.tanks_ = {};
	this.initialiseTargets();
};

Map.prototype.getMapData = function(loc) {
  try {
    delete require.cache[require.resolve('./'+loc)];
    var gameData = require('./'+loc);
    return gameData;
  } catch (err) {
    console.log('ERROR: mapData invalid '+loc);
    console.log(err.toString());
    return null;
  }
};

Map.prototype.setMapId = function(id) {
	this.mapId_ = (id >= 0 && id < this.data_.length)?id:0;
	this.initialise();
	return this.mapId_;
};

Map.prototype.getMap = function() {
	return this.data_[this.mapId_];
};

Map.prototype.initialiseTargets = function() {
	this.targets_ = {};
	this.createTargets();
	this.placeTargetsInMap();
};

Map.prototype.createTargets = function() {
	var id;
	for (id in Target.TargetIds) {
		this.addTarget(new Target(Target.TargetIds[id], false));
	}
};

Map.prototype.placeTargetsInMap = function() {
	for (var y = 0; y < this.yLimit_; y++) {
		for (var x = 0; x < this.xLimit_; x++) {
			var matchingTargetId = this.getTargetIdBasedOnTargetCode(this.getMap()[y][x]);
			if (matchingTargetId) {
				this.getMap()[y][x] = matchingTargetId;
			}
		}
	}
};

Map.prototype.getTargetIdBasedOnTargetCode = function(targetCode) {
	for (var key in TargetCodes) {
		if (TargetCodes[key] == targetCode) {
			return key;
		}
	}
};

Map.prototype.getTank = function(tankId) {
	return this.tanks_[tankId];
};

Map.prototype.getTankWithColour = function(colour) {
  return Underscore.filter(this.tanks_, function(tank) { return tank.getColour() == colour; })[0];
};

Map.prototype.tankExistsWithColour = function(colour) {
	var tank = this.getTankWithColour(colour);
  return tank != undefined && tank != null;
};

Map.prototype.getTarget = function(targetId) {
	return this.targets_[targetId];
};

Map.prototype.addTank = function(tank) {
	this.tanks_[tank.getId()] = tank;
	var position = tank.getPosition();
	this.getMap()[position.y][position.x] = tank.getId();
};

Map.prototype.addTarget = function(target) {
	this.targets_[target.getId()] = target;
};

Map.prototype.removeTankFromMap = function(tankId) {
  var tankPos = this.tanks_[tankId].getPosition();
  this.getMap()[tankPos.y][tankPos.x] = MapCodes.EMPTY;
};

Map.prototype.doesTankExist = function(tankId) {
	return this.tanks_.hasOwnProperty(tankId);
};

Map.prototype.doesTargetExist = function(targetId) {
	return this.targets_.hasOwnProperty(targetId);
};

Map.prototype.numberOfTanks = function() {
	var tankCount = 0, key;
	for(key in this.tanks_) {
		if(this.tanks_.hasOwnProperty(key)) tankCount++;
	}
	return tankCount;
};

Map.prototype.moveTank = function(tank, direction) {
	var nextEntity = this.getNextEntityFrom(tank.getPosition(), direction);
	if(nextEntity.distance < 1) {
		return MoveResult.BLOCKED;
	} else {
		var oldPosition = tank.getPosition();
		this.getMap()[oldPosition.y][oldPosition.x] = MapCodes.EMPTY;
		tank.move(direction);
		var newPosition = tank.getPosition();
		this.getMap()[newPosition.y][newPosition.x] = tank.getId();
		return MoveResult.MOVED;
	}
};

Map.prototype.getEntityAt = function(position) {
	this.isPositionValid(position);
	var mapData = this.getMap()[position.y][position.x];
	switch(mapData) {
		case MapCodes.EMPTY:
			return {
				entityType: null,
				entity: null
			};
		case MapCodes.WALL:
			return {
				entityType: EntityType.WALL,
				entity: null
			};
		case MapCodes.HILL:
			return {
				entityType: EntityType.HILL,
				entity: { state: 0, owner: 0 }
			};
		default:
			if (this.doesTankExist(mapData)) {
				return {
					entityType: EntityType.TANK,
					entity: this.getTank(mapData)
				};
			} else if (this.doesTargetExist(mapData)) {
				return { 
					entityType: EntityType.TARGET,
					entity: this.getTarget(mapData)
				};
			}
	}
};

Map.prototype.isPositionValid = function(position) {
	var xConditions, yConditions;

	if(position) {
		xConditions = (
			position.x != undefined &&
			position.x != null &&
			position.x >= 0 &&
			position.x < this.xLimit_
		);
		yConditions = (
			position.y != undefined &&
			position.y != null &&
			position.y >= 0 &&
			position.y < this.yLimit_
		);
	}

	if(!position || !xConditions || !yConditions) {
		throw new Error('Invalid position!');
	}
};

Map.prototype.getNextEntityFrom = function(position, direction) {
  var result = {origin: position, 'direction': direction, distance: 0, entityType: 0};

	var nextPosition = {x: position.x, y: position.y};
	nextPosition = this.getTheNextPosition(nextPosition, direction);

	var distanceCounter = 0;
	while(this.isLimitNotPassed(nextPosition, direction)) {
		var entity = this.getEntityAt(nextPosition);
		if (this.isEntitySolid(entity)) {
      result.distance = distanceCounter;
			result.entityType = entity.entityType;
			return result;
		} else {
			distanceCounter++;
		}
		nextPosition = this.getTheNextPosition(nextPosition, direction);
	};
	result.distance = distanceCounter;
	result.entityType = EntityType.WALL;
	return result;
};

Map.prototype.isLimitNotPassed = function(nextPosition, direction) {
	switch(direction) {
		case Direction.NORTH:
      return nextPosition.y >= 0;
		case Direction.WEST:
			return nextPosition.x >= 0;
		case Direction.EAST:
      return nextPosition.x < this.xLimit_;
		case Direction.SOUTH:
      return nextPosition.y < this.yLimit_;
	}
};

Map.prototype.getTheNextPosition = function(nextPosition, direction) {
	return Map.getPositionFromDistanceAndDirection(nextPosition, 0, direction);
};

Map.getPositionFromDistanceAndDirection = function(origin, distance, direction) {
	switch(direction) {
		case Direction.NORTH:
			return { x: origin.x, y: (origin.y - distance - 1) };
		case Direction.EAST:
			return { x: (origin.x + distance + 1), y: origin.y };
		case Direction.SOUTH:
			return { x: origin.x, y: (origin.y + distance + 1) };
		case Direction.WEST:
			return { x: (origin.x - distance - 1), y: origin.y };
	}
};

Map.prototype.getLimits = function() {
	return {x: this.xLimit_, y: this.yLimit_};
};

Map.prototype.isEntitySolid = function(entity) {
	return (
		entity.entityType == EntityType.WALL || 
		entity.entityType == EntityType.TANK || 
		entity.entityType == EntityType.TARGET );
};

Map.prototype.calculateTankCenterDisplacement = function(tankId) {
  var tank = this.getTank(tankId);
  var center = this.getCenter();
  var xDisplacement = Math.abs(tank.getPosition().x - center.x);
  var yDisplacement = Math.abs(tank.getPosition().y - center.y);
  if (xDisplacement >= yDisplacement) {
    return xDisplacement
  } else {
    return yDisplacement;
  }
};

Map.prototype.getCenter = function() {
  return {x: Math.floor(this.xLimit_/2), y: Math.floor(this.yLimit_/2)};
};

var MapCodes = {
	EMPTY: 			0,
	WALL: 			1,
	HILL: 			2
};

Map.prototype.MapCodes = MapCodes;

var TargetCodes = {
	LEVEL_1_NORTH: 	3,
	LEVEL_1_EAST: 	4,
	LEVEL_1_SOUTH: 	5,
	LEVEL_1_WEST: 	6,
	LEVEL_2_NORTH: 	7,
	LEVEL_2_EAST: 	8,
	LEVEL_2_SOUTH: 	9,
	LEVEL_2_WEST: 	10
};

module.exports = Map;