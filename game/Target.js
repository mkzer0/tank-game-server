
var Direction = require('./Direction.js');

var Target = function(targetId, destroyed) {
	this.id_ = targetId;
	this.destroyed_ = destroyed;
};

Target.prototype.getId = function() {
	return this.id_;
};

Target.prototype.getDirection = function() {
	return Direction[this.id_.substring(8)];
};

Target.prototype.getValue = function() {
	return Target.TargetValue[this.id_.substring(0,7)];
};

Target.prototype.isDestroyed = function() {
	return this.destroyed_;
};

Target.prototype.setStateAsDestroyed = function() {
	this.destroyed_ = true;
};

Target.TargetIds = {
	LEVEL_1_NORTH: 'LEVEL_1_NORTH',
	LEVEL_2_NORTH: 'LEVEL_2_NORTH',
	LEVEL_1_SOUTH: 'LEVEL_1_SOUTH',
	LEVEL_2_SOUTH: 'LEVEL_2_SOUTH',
	LEVEL_1_EAST: 'LEVEL_1_EAST',
	LEVEL_2_EAST: 'LEVEL_2_EAST',
	LEVEL_1_WEST: 'LEVEL_1_WEST',
	LEVEL_2_WEST: 'LEVEL_2_WEST'
};

Target.TargetValue = {
	LEVEL_1 : 5,
	LEVEL_2 : 10
};

module.exports = Target;