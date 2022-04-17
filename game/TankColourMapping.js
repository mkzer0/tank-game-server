var Logger = new (require('./Logger.js'))();

var Tank = require('./Tank.js');

var TankColourMapping = function(xLimit, yLimit) {
	this.xLimit_ = xLimit;
	this.yLimit_ = yLimit;
	this.initialise();
};

TankColourMapping.prototype.initialise = function() {
  this.options = {};
	this.options[Tank.Colours.BLUE] = {
    name: "BLUE TEAM",
    colour: Tank.Colours.BLUE,
    position: {x: 1, y: 1}
  };
	this.options[Tank.Colours.GREEN] = {
    name: "GREEN TEAM",
    colour: Tank.Colours.GREEN,
    position: {x: this.xLimit_-2, y: 1}
  };
	this.options[Tank.Colours.RED] = {
    name: "RED TEAM",
    colour: Tank.Colours.RED,
    position: {x: 1, y: this.yLimit_-2}
  };
	this.options[Tank.Colours.YELLOW] = {
    name: "YELLOW TEAM",
    colour: Tank.Colours.YELLOW,
    position: {x: this.xLimit_-2, y: this.yLimit_-2}
  };
};

TankColourMapping.prototype.isValidColour = function(colour) {
  return this.options[colour] != undefined || this.options[colour] != null;
};

TankColourMapping.prototype.getTankInitialProperties = function(colour) {
	if (this.options[colour] == undefined || this.options[colour] == null) {
    return {};
  }
  return this.copyInitialTankProperties(this.options[colour]);
};

TankColourMapping.prototype.copyInitialTankProperties = function(tankProperties) {
  return {
    name: tankProperties.name,
    colour: tankProperties.colour,
    position: {
      x: tankProperties.position.x,
      y: tankProperties.position.y
    }
  };
};

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

try {
	module.exports = TankColourMapping;
} catch(err) {}