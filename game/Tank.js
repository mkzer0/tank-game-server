var Direction;
try {
	Direction = require("./Direction.js")
} catch (err) {}

function Tank(id, name, initialPosition, colour, ammo) {
	this.id_ = id;
	this.name_ = name;
	this.ammo_ = ammo;
	this.health_ = 100;
	this.score_ = 0;
	this.colour_ = colour;
  this.justDied_ = false;
	this.queuedAction_ = null;
	
	if (initialPosition.x != undefined && initialPosition.y != undefined) {
		this.position_ = initialPosition;
	} else {
		this.position_ = { x: initialPosition[0], y: initialPosition[1] };
	}
};

Tank.createFrom = function(tankJson) {
	var tank = new Tank(
		tankJson.id_,
		tankJson.name_,
		tankJson.position_,
		tankJson.colour_
	);
	tank.setHealth(tankJson.health_);
	tank.setScore(tankJson.score_);
	tank.setAmmo(tankJson.ammo_);
	return tank;
};

Tank.prototype.move = function(direction) {
	switch(direction) {
		case Direction.NORTH:
			this.position_.y--;
			return;
		case Direction.EAST:
			this.position_.x++;
			return;
		case Direction.SOUTH:
			this.position_.y++;
			return;
		case Direction.WEST:
			this.position_.x--;
			return;
		default:
			throw new Error('Invalid Direction Error: '+direction);
	}
};

Tank.prototype.takesTankAttackDamage = function() {
	this.health_ -= Tank.ATTACK_DAMAGE;
};

Tank.prototype.scoreIncreasesBy = function(amount) {
	this.score_ += amount;
};

Tank.prototype.reduceAmmoBy = function(amount) {
	if (this.ammo_ == 0) return;
	if (this.ammo_ == -1) return;
	this.ammo_ -= amount;
}

Tank.prototype.getId = function() {
	return this.id_;
};

Tank.prototype.getName = function() {
  return this.name_;
};

Tank.prototype.getHealth = function() {
  return this.health_;
};

Tank.prototype.getAmmo = function() {
  return this.ammo_;
}

Tank.prototype.getScore = function() {
  return this.score_;
};

Tank.prototype.getColour = function() {
  return this.colour_;
};

Tank.prototype.setScore = function(score) {
    this.score_ = score;
};

Tank.prototype.setAmmo = function(ammo) {
	this.ammo_ = ammo;
}

Tank.prototype.hasAmmo = function() {
	return (this.ammo_ < 0 || this.ammo_ > 0);
}

Tank.prototype.getLocation = function() {
	return [this.position_.x, this.position_.y];
};

Tank.prototype.getPosition = function() {
	return {x: this.position_.x, y: this.position_.y};
};

Tank.prototype.getBoard = function() {
	return this.board_;
};

Tank.prototype.hasRecentlyDied = function() {
  return this.justDied_;
};

Tank.prototype.setRecentlyDied = function(bool) {
  this.justDied_ = bool;
};

Tank.prototype.setHealth = function(hp) {
    this.health_ = hp;
    this.health_ = (hp >= 0)?hp:0;
    return hp;
};

Tank.prototype.setLocation = function(loc) {
	this.position_.x = loc[0];
	this.position_.y = loc[1];
};

Tank.prototype.setBoard = function(board) {
	this.board_ = board;
};

Tank.prototype.addKill = function() {
	// store count?
	this.addScore(10);
};

Tank.prototype.addTarget = function() {
	// store count?
	this.addScore(10);
};

Tank.prototype.addScore = function(score) {
	this.score_ += score;
};

Tank.prototype.updateBoard = function() {
	if (this.board_) {
		this.board_.updateStatus(this, true);
	}
};

Tank.prototype.hasTaskScheduled = function() {
  if (this.task_ == null) {
    return false;
  } else {
    return true;
  }
};

Tank.prototype.hasQueuedAction = function() {
	return (this.queuedAction_ != null);
};

Tank.prototype.getQueuedAction = function() {
	return this.queuedAction_;
};

Tank.prototype.queueAction = function(action, callback) {
	if (action == null || callback == null) this.queuedAction_ = null;
	else
		this.queuedAction_ = {action: action, callback: callback};
};

Tank.prototype.setTask = function(taskId) {
  this.task_ = taskId;
};

Tank.prototype.getTask = function() {
  return this.task_;
};

Tank.prototype.clearTask = function() {
  this.task_ = null;
};

Tank.ATTACK_DAMAGE = 10;

Tank.Colours = {
  BLUE:   'blue',
  GREEN:  'green',
  RED:    'red',
  YELLOW: 'yellow'
}

Tank.prototype.task_ = null;
Tank.prototype.position_ = null;
Tank.prototype.board_ = null;

try {
	module.exports = Tank;
} catch (err) {}