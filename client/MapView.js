
/* Time: measured in milliseconds */
Animation = {
    MOVE: {
        Time: 500
    },
    BLOCKED: {
        Time: 250, /* refers to sprite animation time */
        Frames: 5,
        BumpBack: 125, /* refers to tweens */
        BumpForward: 125
    },
    FIRE: {
        Time: 250,
        Frames: 8,
        BumpBack: 75,
        BumpForward: 125
    },
    HIT: {
        Time: [250,750], /* delay/duration */
        Frames: 8
    },
    OOM: {
        Time: 250,
        Frames: 5
    },
    DESTROY: {
        Time: 750,
        Frames: 10
    },
    SCAN: {
        Time: 250,
        Frames: 7
    },
    SPAWN: {
        Time: 750,
        Frames: 7
    }
}

MapView.DIRECTION = {
    NORTH: 0,
    SOUTH: 180,
    EAST:  90,
    WEST:  270
};

function MapView(parent, map, theme) {
	this.parent_ = parent;
	this.map_ = map;
    this.theme_ = theme;
	this.initialize_();
};

MapView.prototype.initialize_ = function() {
	this.reinitialize_();
};

MapView.prototype.reinitialize_ = function() {
    // clear out previous
    $(this.parent_).empty();
    
    this.blockSize_ = this.calculateBlocksize_();
    this.mapSize_ = this.calculateMapsize_(this.blockSize_, this.map_);

    this.layers_ = {};
    this.stage_ = new Kinetic.Stage({
    	container: this.parent_.id,
    	width: this.mapSize_[0],
    	height: this.mapSize_[1]
    });

    this.layers_.map = new Kinetic.Layer();
    this.layers_.targets = new Kinetic.Layer();
    this.layers_.tanks = new Kinetic.Layer();
    this.layers_.fire = new Kinetic.Layer();
    this.layers_.explode = new Kinetic.Layer();
    this.layers_.scans = new Kinetic.Layer();
    this.layers_.spawns = new Kinetic.Layer();

    this.stage_.add(this.layers_.map);
    this.stage_.add(this.layers_.targets);
    this.stage_.add(this.layers_.tanks);
    this.stage_.add(this.layers_.fire);
    this.stage_.add(this.layers_.explode);
    this.stage_.add(this.layers_.scans);
    this.stage_.add(this.layers_.spawns);

    this.pos_ = [this.parent_.offsetTop,this.parent_.offsetLeft];
    this.drawMap_(this.map_);

    // stores
    this.tanks_ = [];
    this.targets_ = [];
    this.koth_ = [];
    this.tracks_ = [];

    // prepare the tracks array storage
    for (var i=0; i < this.map_.length; i++) {
        this.tracks_[i] = [];
        for (var j=0; j < this.map_[0].length; j++) {
            this.tracks_[i][j] = undefined;
        }
    }

    this.stage_.draw();
};

MapView.prototype.updateSize = function() {
    this.reinitialize_();
};

MapView.prototype.calculateBlocksize_ = function() {
	var width = this.parent_.offsetWidth;
	var height = this.parent_.offsetHeight;
	
	var blockSize = (height>width)?width/(this.map_).length:height/(this.map_).length;
	return blockSize;
};

MapView.prototype.calculateMapsize_ = function(blockSize, map) {
	return [map[0].length*blockSize, map.length*blockSize];
};

MapView.prototype.getBlocksize = function() {
	return this.blockSize_;
};

MapView.prototype.drawMap_ = function(map) {	
	var tmpLoc = [0,0];
	for (var i=0; i < map.length; i++) {
		for (var j=0; j < map[i].length; j++) {
			this.drawObject(tmpLoc,map[i][j]);
			tmpLoc[0]++;
		}
		
		tmpLoc[0]=0;
		tmpLoc[1]++;
	}
};

MapView.TYPE = {
    MUD:    0,
    MUDH:   7,
    MUDV:   8,
    MUDHV:  9,
    WALL:   1,
    KOTH:   2,
    TARGETN:3,
    TARGETE:4,
    TARGETS:5,
    TARGETW:6
};

MapView.prototype.drawObject = function (loc, type) {
    var properties = {};
    switch (type) {
        case MapView.TYPE.MUD:
        case MapView.TYPE.MUDH:
        case MapView.TYPE.MUDV:
        case MapView.TYPE.MUDHV:
            this.addFloor(loc);
            break;
        case MapView.TYPE.WALL:
            this.addWall(loc);
            break;
        case MapView.TYPE.KOTH:
            this.addKoth(loc);
            break;
        case MapView.TYPE.TARGETN:
        case MapView.TYPE.TARGETE:
        case MapView.TYPE.TARGETS:
        case MapView.TYPE.TARGETW:
            this.addTarget(loc,type);
            break;
        default:
            break;
    }
};

MapView.prototype.addFloor = function(loc) {
    var properties = {
        id:     'floor-'+loc[0]+'-'+loc[1],
        pos:    this.relativeLocation(loc),
        size:   [this.getBlocksize(), this.getBlocksize()],
        src:    Theme.getFloorImage(this.getTheme())
    };
    Canvas.drawImage(this.layers_.map, properties);
};

MapView.prototype.addWall = function(loc) {
    var properties = {
        id:     'wall-'+loc[0]+'-'+loc[1],
        pos:    this.relativeLocation(loc),
        size:   [this.getBlocksize(), this.getBlocksize()],
        src:    Theme.getWallImage(this.getTheme())
    };
    Canvas.drawImage(this.layers_.map, properties);
};

MapView.prototype.addKoth = function(loc) {
    var properties = {
        id:     'koth-'+loc[0]+'-'+loc[1],
        pos: this.relativeLocation(loc),
        size: [this.getBlocksize(), this.getBlocksize()],
        src: Theme.getKothImage(this.getTheme(),'neutral')
    };
    Canvas.drawImage(this.layers_.map, properties);
};

MapView.prototype.addTarget = function(loc, facing) {
    // calculate rotation based on facing
    var rotation;
    switch (facing) {
        case MapView.TYPE.TARGETN:
            rotation = 180;
            break;
        case MapView.TYPE.TARGETE:
            rotation = 270;
            break;
        case MapView.TYPE.TARGETS:
            rotation = 0;
            break;
        case MapView.TYPE.TARGETW:
            rotation = 90;
            break;
    }

	var properties = {
        id:     'target-'+loc[0]+'-'+loc[1],
		pos:	this.relativeLocation(loc),
		size:	[this.getBlocksize(),this.getBlocksize()],
		src:	Theme.getTargetImage(this.getTheme(),'active')
	};
	var img = Canvas.drawImage(this.layers_.targets, properties);
    img.setRotationDeg(rotation);
};

MapView.prototype.addTank = function (tank) {
    var properties = {
        id:     'tank-'+tank.getId(),
        pos:    this.relativeLocation(tank.getLocation()),
        size:   [this.getBlocksize(), this.getBlocksize()],
        src:    Theme.getTankImage(this.getTheme(),tank.getColour())
    };
    var tankNode = Canvas.drawImage(this.layers_.tanks, properties);

    // store
    this.storeTankInfo(tank,tankNode);

    // animate tank spawn and then spawn tank
    this.animateTankSpawn(tank.getId());
};

MapView.prototype.removeTank = function(tankId) {
    var tankInfo = this.tanks_[tankId];
    // remove from map/destroy
    tankInfo.node.destroy();
    // delete from tanks
    // delete this.tanks_[tankId];
};

MapView.prototype.animateTankMove = function(tankId, direction, onFinishedMove) {
  switch(direction) {
    case Direction.SOUTH:
      this.moveTankSouth(tankId, onFinishedMove);
      break;
    case Direction.NORTH:
      this.moveTankNorth(tankId, onFinishedMove);
      break;
    case Direction.EAST:
      this.moveTankEast(tankId, onFinishedMove);
      break;
    case Direction.WEST:
      this.moveTankWest(tankId, onFinishedMove);
      break;
  }
}

MapView.prototype.moveTank = function(tankNode, to, onFinishedMove) {
    var relLoc = this.relativeLocation(to);
    var tween = Canvas.tween(
        tankNode,
        [relLoc[0]+(tankNode.getWidth()/2), relLoc[1]+(tankNode.getHeight()/2)],
        Animation.MOVE.Time,
        [this.getBlocksize(),this.getBlocksize()],
        onFinishedMove
    );
    tween.play();
};

MapView.prototype.moveTankNorth = function (tankId, onFinishedMove) {
    var tank = this.getTank(tankId);
    var tankNode = this.getTankNode(tankId);

    var loc = tank.getLocation();
    this.trackMark(loc, MapView.DIRECTION.NORTH);

    this.moveTank(tankNode, [loc[0], loc[1] - 1], onFinishedMove);
};

MapView.prototype.moveTankEast = function (tankId, onFinishedMove) {
    var tank = this.getTank(tankId);
    var tankNode = this.getTankNode(tankId);
    
    var loc = tank.getLocation();
    this.trackMark(loc, MapView.DIRECTION.EAST);

    this.moveTank(tankNode, [loc[0] + 1, loc[1]], onFinishedMove);
};

MapView.prototype.moveTankSouth = function (tankId, onFinishedMove) {
    var tank = this.getTank(tankId);
    var tankNode = this.getTankNode(tankId);

    var loc = tank.getLocation();
    this.trackMark(loc, MapView.DIRECTION.SOUTH);
    
    this.moveTank(tankNode, [loc[0], loc[1] + 1], onFinishedMove);
};

MapView.prototype.moveTankWest = function (tankId, onFinishedMove) {
    var tank = this.getTank(tankId);
    var tankNode = this.getTankNode(tankId);
    
    var loc = tank.getLocation();
    this.trackMark(loc, MapView.DIRECTION.WEST);
    
    this.moveTank(tankNode, [loc[0] - 1, loc[1]], onFinishedMove);
};

MapView.prototype.animateTankBumpback = function(tankId, direction, onFinishedMove) {
    var tank = this.getTank(tankId);
    var origin = tank.getPosition();
    var to = tank.getPosition();
    var toTweens = [];
    var facing = 0;

    switch(direction) {
        case Direction.SOUTH:
            toTweens.push([to.x, to.y-0.3]);
            break;
        case Direction.NORTH:
            toTweens.push([to.x, to.y+0.3]);
            facing = 180;
            break;
        case Direction.EAST:
            toTweens.push([to.x-0.3, to.y]);
            facing = 270;
            break;
        case Direction.WEST:
            toTweens.push([to.x+0.3, to.y]);
            facing = 90;
            break;
    }
    // push origin
    toTweens.push([origin.x, origin.y]);

    this.moveTankBumpback(tankId, toTweens, facing, Animation.FIRE.BumpBack, Animation.FIRE.BumpForward, onFinishedMove);
};

MapView.prototype.animateTankBlockedMove = function(tankId, direction, onFinishedMove) {
    var tank = this.getTank(tankId);
    var origin = tank.getPosition();
    var to = tank.getPosition();
    var toTweens = [];
    var facing = 0;

    switch(direction) {
        case Direction.SOUTH:
            toTweens.push([to.x, to.y-0.3]);
            break;
        case Direction.NORTH:
            toTweens.push([to.x, to.y+0.3]);
            facing = 180;
            break;
        case Direction.EAST:
            toTweens.push([to.x-0.3, to.y]);
            facing = 270;
            break;
        case Direction.WEST:
            toTweens.push([to.x+0.3, to.y]);
            facing = 90;
            break;
    }
    // push origin
    toTweens.push([origin.x, origin.y]);

    this.moveTankBlocked(tankId, [origin.x, origin.y], facing, undefined);
    //this.moveTankBumpback(tankId, toTweens, facing, Animation.BLOCKED.BumpBack, Animation.BLOCKED.BumpForward, onFinishedMove);
};

MapView.prototype.moveTankBumpback = function(tankId, toTweens, facing, bumpbackDuration, bumpforwardDuration, onFinished) {
    var tankNode = this.getTankNode(tankId);
    var offsetWidth = (tankNode.getWidth()/2);
    var offsetHeight = (tankNode.getHeight()/2);
    
    // relative locations
    for (var i=0; i < toTweens.length; i++) {
        toTweens[i] = this.relativeLocation(toTweens[i]);
    }

    // play bumpback
    var bumpBack = Canvas.tween(
        tankNode,
        [toTweens[0][0]+offsetWidth, toTweens[0][1]+offsetHeight],
        bumpbackDuration,
        undefined,
        function() {
            if (tankNode) {
                var bumpForward = Canvas.tween(
                    tankNode,
                    [toTweens[1][0]+offsetWidth, toTweens[1][1]+offsetHeight],
                    bumpforwardDuration,
                    undefined,
                    onFinished
                );
                bumpForward.play();
            }
        }
    );
    bumpBack.play();
};

MapView.prototype.moveTankBlocked = function(tankId, loc, facing, onFinished) {
    var tankNode = this.getTankNode(tankId);
    var offsetWidth = (tankNode.getWidth()/2);
    var offsetHeight = (tankNode.getHeight()/2);
    
    var tankBlockedSize = [30,30];

    // play block move sprite animation
    var animations = {play:[]};
    for (var i=0; i < Animation.BLOCKED.Frames; i++) {
        var frame = {
            x: 0+(i*tankBlockedSize[0]),
            y: 0,
            width:  tankBlockedSize[0],
            height: tankBlockedSize[1]
        };
        animations.play.push(frame);
    }
    var bumpSprite = Canvas.drawSprite(this.layers_.fire, {
        src:        Theme.getBumpAnimation(this.getTheme()),
        pos:        this.relativeLocation(loc),
        originSize: tankBlockedSize,
        displaySize:[this.getBlocksize()*(tankBlockedSize[0]/30),this.getBlocksize()*(tankBlockedSize[1]/30)],
        animations: animations,
        framerate:  Animation.BLOCKED.Frames/((Animation.BLOCKED.Time)/1000) 
                    /* converts milliseconds to frames/per/second */
        }, onFinished
    );
    bumpSprite.setRotationDeg(facing);

    // play audio
    Audio.play(Theme.getBumpAudio(this.getTheme()));
};

MapView.prototype.trackMark = function (loc, direction) {
    switch (direction) {
        case MapView.DIRECTION.NORTH:
            switch (this.map_[loc[0]][loc[1]]) {
                case MapView.TYPE.MUD:
                case MapView.TYPE.MUDV:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                case MapView.TYPE.MUDH:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDHV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal+vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                default:
                    break;
            }
            switch (this.map_[loc[0]][loc[1] - 1]) {
                case MapView.TYPE.MUD:
                    this.map_[loc[0]][loc[1] - 1] = MapView.TYPE.MUDV;
                    break;
                default:
                    break;
            }        
            break;
        case MapView.DIRECTION.SOUTH:
            switch (this.map_[loc[0]][loc[1]]) {
                case MapView.TYPE.MUD:
                case MapView.TYPE.MUDV:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                case MapView.TYPE.MUDH:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDHV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal+vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                default:
                    break;
            }
            switch (this.map_[loc[0]][loc[1] + 1]) {
                case MapView.TYPE.MUD:
                    this.map_[loc[0]][loc[1] + 1] = MapView.TYPE.MUDV;
                    break;
                default:
                    break;
            }        
            break;
        case MapView.DIRECTION.EAST:
            switch (this.map_[loc[0]][loc[1]]) {
                case MapView.TYPE.MUD:
                case MapView.TYPE.MUDH:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDH;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                case MapView.TYPE.MUDV:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDHV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal+vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                default:
                    break;
            }
            switch (this.map_[loc[0] + 1][loc[1]]) {
                case MapView.TYPE.MUD:
                    this.map_[loc[0] + 1][loc[1]] = MapView.TYPE.MUDH;
                    break;
                default:
                    break;
            }        
            break;
        case MapView.DIRECTION.WEST:
            switch (this.map_[loc[0]][loc[1]]) {
                case MapView.TYPE.MUD:
                case MapView.TYPE.MUDH:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDH;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                case MapView.TYPE.MUDV:
                    this.map_[loc[0]][loc[1]] = MapView.TYPE.MUDHV;
                    var properties = {
                        pos: this.relativeLocation(loc),
                        size: [this.getBlocksize(), this.getBlocksize()],
                        src: Theme.getFloorImage(this.getTheme(), 'horizontal+vertical')
                    };
                    // redraw the track at this location with properties
                    this.redrawTrack(loc, properties);
                    break;
                default:
                    break;
            }
            switch (this.map_[loc[0] - 1][loc[1]]) {
                case MapView.TYPE.MUD:
                    this.map_[loc[0] - 1][loc[1]] = MapView.TYPE.MUDH;
                    break;
                default:
                    break;
            }        
            break;
    }
};

MapView.prototype.redrawTrack = function(loc, properties) {
    this.removeTrackAt(loc);

    // draw new track, and store
    this.tracks_[loc[0]][loc[1]] = Canvas.drawImage(this.layers_.map, properties);
};

MapView.prototype.removeTrackAt = function(loc) {
    // check that we have a node there
    if (this.tracks_[loc[0]][loc[1]]) {
        // destroy the node (destroys it and removes it)
        this.tracks_[loc[0]][loc[1]].destroy();
    }
};

MapView.prototype.captureKoth = function (robot, loc) {
    /*
    var size = [this.getBlocksize(), this.getBlocksize()];
    var img = '../resources/koth-'+robot.getColour()+'.png';
    var properties = {
        pos: this.relativeLocation(loc),
        size: size,
        src: img
    };
    Canvas.drawImage(this.layers_.map, properties);
    */
};

MapView.prototype.animateTankAttack = function(tankId, toDirection, strikeLocation) {
  var attackOrigin = this.getTank(tankId).getLocation();

  switch(toDirection) {
    case Direction.SOUTH:
      this.fireFromSouth(attackOrigin);
      this.hitFromSouth(strikeLocation);
      break;
    case Direction.NORTH:
      this.fireFromNorth(attackOrigin);
      this.hitFromNorth(strikeLocation);
      break;
    case Direction.WEST:
      this.fireFromWest(attackOrigin);
      this.hitFromWest(strikeLocation);
      break;
    case Direction.EAST:
      this.fireFromEast(attackOrigin);
      this.hitFromEast(strikeLocation);
      break;
    }

    // play bumpback
    this.animateTankBumpback(tankId, toDirection, undefined);
};

MapView.prototype.fireFromNorth = function(loc) {
    this.fireShotFrom(loc,MapView.DIRECTION.NORTH);
};
MapView.prototype.fireFromEast = function(loc) {
    this.fireShotFrom(loc,MapView.DIRECTION.EAST);
};
MapView.prototype.fireFromSouth = function(loc) {
    this.fireShotFrom(loc,MapView.DIRECTION.SOUTH);
};
MapView.prototype.fireFromWest = function(loc) {
    this.fireShotFrom(loc,MapView.DIRECTION.WEST);
};
MapView.prototype.hitFromNorth = function(loc) {
    this.fireHitAt(loc,MapView.DIRECTION.NORTH);
};
MapView.prototype.hitFromEast = function(loc) {
    this.fireHitAt(loc,MapView.DIRECTION.EAST);
};
MapView.prototype.hitFromSouth = function(loc) {
    this.fireHitAt(loc,MapView.DIRECTION.SOUTH);
};
MapView.prototype.hitFromWest = function(loc) {
    this.fireHitAt(loc,MapView.DIRECTION.WEST);
};

MapView.prototype.fireShotFrom = function(loc, facing, onFinished) {
    if (loc) {
        // nudge location
        var nudge = 0.8;
        switch (facing) {
            case MapView.DIRECTION.NORTH: loc[1] -= nudge;
                break;
            case MapView.DIRECTION.SOUTH: loc[1] += nudge;
                break;
            case MapView.DIRECTION.EAST:  loc[0] += nudge;
                break;
            case MapView.DIRECTION.WEST:  loc[0] -= nudge; 
                break;
        }

        var fireShotSize = [30,30];
        loc[0] -= ((fireShotSize[0]/30)-1)/2;
        loc[1] -= ((fireShotSize[1]/30)-1)/2;

        var animations = {play:[]};
        for (var i=0; i < Animation.FIRE.Frames; i++) {
            var frame = {
                x: 0+(i*fireShotSize[0]),
                y: 0,
                width:  fireShotSize[0],
                height: fireShotSize[1]
            };
            animations.play.push(frame);
        }

        var fireSprite = Canvas.drawSprite(this.layers_.fire, {
            src:        Theme.getShootAnimation(this.getTheme()),
            pos:        this.relativeLocation(loc),
            originSize: fireShotSize,
            displaySize:[this.getBlocksize()*(fireShotSize[0]/30),this.getBlocksize()*(fireShotSize[1]/30)],
            animations: animations,
            framerate:  Animation.FIRE.Frames/((Animation.FIRE.Time)/1000) 
            }, onFinished
        );
        fireSprite.setRotationDeg(facing);

        // play audio
        Audio.play(Theme.getShootAudio(this.getTheme()));
    }
};

MapView.prototype.fireHitAt = function(loc, facing, onFinished) {
    if (loc) {
        var nudge = 0.8;
        switch (facing) {
            case MapView.DIRECTION.NORTH: loc[1] += nudge;
                break;
            case MapView.DIRECTION.SOUTH: loc[1] -= nudge;
                break;
            case MapView.DIRECTION.EAST:  loc[0] -= nudge;
                break;
            case MapView.DIRECTION.WEST:  loc[0] += nudge; 
                break;
        }

        var fireHitSize = [30,30];
        loc[0] -= ((fireHitSize[0]/30)-1)/2;
        loc[1] -= ((fireHitSize[1]/30)-1)/2;        

        var animations = {play:[]};
        for (var i=0; i < Animation.HIT.Frames; i++) {
            var frame = {
                x: 0+(i*fireHitSize[0]),
                y: 0,
                width:  fireHitSize[0],
                height: fireHitSize[1]
            };
            animations.play.push(frame);
        }

        // delay animation first... (for fudged prettyness)
        setTimeout(function() {
            var hitSprite = Canvas.drawSprite(this.layers_.fire, {
                src:        Theme.getHitAnimation(this.getTheme()),
                pos:        this.relativeLocation(loc),
                originSize: fireHitSize,
                displaySize:[this.getBlocksize()*(fireHitSize[0]/30),this.getBlocksize()*(fireHitSize[1]/30)],
                animations: animations,
                framerate:  Animation.HIT.Frames/((Animation.HIT.Time[1])/1000) 
                }, onFinished
            );
            hitSprite.setRotationDeg(facing);

            // play audio
            Audio.play(Theme.getHitAudio(this.getTheme()));
        }.bind(this), Animation.HIT.Time[0]);
    }
};

MapView.prototype.animateTankOom = function(tankId, toDirection, strikeLocation) {
  var attackOrigin = this.getTank(tankId).getLocation();
  this.oom(attackOrigin, toDirection);
};

MapView.prototype.oom = function(loc, facing, onFinished) {
    if (loc) {

        // fix up facing
        switch (facing) {
            case Direction.NORTH: facing = MapView.DIRECTION.NORTH; break;
            case Direction.SOUTH: facing = MapView.DIRECTION.SOUTH; break;
            case Direction.EAST:  facing = MapView.DIRECTION.EAST; break;
            case Direction.WEST:  facing = MapView.DIRECTION.WEST; break;
        }

        // nudge location
        var nudge = 0.8;
        switch (facing) {
            case MapView.DIRECTION.NORTH: loc[1] -= nudge;
                break;
            case MapView.DIRECTION.SOUTH: loc[1] += nudge;
                break;
            case MapView.DIRECTION.EAST:  loc[0] += nudge;
                break;
            case MapView.DIRECTION.WEST:  loc[0] -= nudge; 
                break;
        }

        var fireShotSize = [30,30];
        loc[0] -= ((fireShotSize[0]/30)-1)/2;
        loc[1] -= ((fireShotSize[1]/30)-1)/2;

        var animations = {play:[]};
        for (var i=0; i < Animation.OOM.Frames; i++) {
            var frame = {
                x: 0+(i*fireShotSize[0]),
                y: 0,
                width:  fireShotSize[0],
                height: fireShotSize[1]
            };
            animations.play.push(frame);
        }
        var fireSprite = Canvas.drawSprite(this.layers_.fire, {
            src:        Theme.getOomAnimation(this.getTheme()),
            pos:        this.relativeLocation(loc),
            originSize: fireShotSize,
            displaySize:[this.getBlocksize()*(fireShotSize[0]/30),this.getBlocksize()*(fireShotSize[1]/30)],
            animations: animations,
            framerate:  Animation.OOM.Frames/((Animation.OOM.Time)/1000) 
            }, onFinished
        );
        fireSprite.setRotationDeg(facing);

        // play audio
        Audio.play(Theme.getOomAudio(this.getTheme()));
    }   
}

MapView.prototype.animateTankDestroy = function(tankId, onFinished) {
    // play destroy animation
    var destroyOrigin = this.getTank(tankId).getLocation();
    
    // play destroy animation
    this.destroyAt(destroyOrigin, function() {
        // remove node from map
        this.removeTank(tankId);
        // callback
        if (onFinished) onFinished();
    }.bind(this));
};

MapView.prototype.destroyAt = function(loc, onFinished) {
    if (loc) {
        var destroySize = [60,60];
        loc[0] -= ((destroySize[0]/30)-1)/2;
        loc[1] -= ((destroySize[0]/30)-1)/2;

        var animations = {play:[]};
        for (var i=0; i < Animation.DESTROY.Frames; i++) {
            var frame = {
                x: 0+(i*destroySize[0]),
                y: 0,
                width:  destroySize[0],
                height: destroySize[1]
            };
            animations.play.push(frame);
        }
        var destroySprite = Canvas.drawSprite(this.layers_.explode, {
            src:        Theme.getExplodeAnimation(this.getTheme()),
            pos:        this.relativeLocation(loc),
            originSize: destroySize,
            displaySize:[this.getBlocksize()*(destroySize[0]/30),this.getBlocksize()*(destroySize[1]/30)],
            animations: animations,
            framerate:  Animation.DESTROY.Frames/((Animation.DESTROY.Time)/1000),
            }, onFinished
        );

        // play audio
        Audio.play(Theme.getExplodeAudio(this.getTheme()));
    }
};

MapView.prototype.animateTankScan = function(tankId, onFinished) {
  var scanOrigin = this.getTank(tankId).getLocation();
  this.scanAt(scanOrigin, onFinished);
};

MapView.prototype.scanAt = function(loc, onFinished) {
    if (loc) {
        var scanSize = [90,90];
        loc[0] -= ((scanSize[0]/30)-1)/2;
        loc[1] -= ((scanSize[1]/30)-1)/2;

        var animations = {play:[]};
        for (var i=0; i < Animation.SCAN.Frames; i++) {
            var frame = {
                x: 0+(i*scanSize[0]),
                y: 0,
                width:  scanSize[0],
                height: scanSize[1]
            };
            animations.play.push(frame);
        }

        var scanSprite = Canvas.drawSprite(this.layers_.scans, {
            src:        Theme.getScanAnimation(this.getTheme()),
            pos:        this.relativeLocation(loc),
            originSize: scanSize,
            displaySize:[this.getBlocksize()*(scanSize[0]/30),this.getBlocksize()*(scanSize[1]/30)],
            animations: animations,
            framerate:  Animation.SCAN.Frames/((Animation.SCAN.Time)/1000)
            }, onFinished)
        ;

        // play audio
        Audio.play(Theme.getScanAudio(this.getTheme()));
    }
};

MapView.prototype.animateTankSpawn = function(tankId, onFinished) {
  var scanOrigin = this.getTank(tankId).getLocation();
  this.spawnAt(scanOrigin, onFinished);
};

MapView.prototype.spawnAt = function(loc, onFinished) {
    if (loc) {
        var scanSize = [30,30];
        loc[0] -= ((scanSize[0]/30)-1)/2;
        loc[1] -= ((scanSize[1]/30)-1)/2;

        var animations = {play:[]};
        for (var i=0; i < Animation.SPAWN.Frames; i++) {
            var frame = {
                x: 0+(i*scanSize[0]),
                y: 0,
                width:  scanSize[0],
                height: scanSize[1]
            };
            animations.play.push(frame);
        }

        var scanSprite = Canvas.drawSprite(this.layers_.spawns, {
            src:        Theme.getSpawnAnimation(this.getTheme()),
            pos:        this.relativeLocation(loc),
            originSize: scanSize,
            displaySize:[this.getBlocksize()*(scanSize[0]/30),this.getBlocksize()*(scanSize[1]/30)],
            animations: animations,
            framerate:  Animation.SPAWN.Frames/((Animation.SPAWN.Time)/1000) 
            }, onFinished
        );

        // play audio
        Audio.play(Theme.getSpawnAudio(this.getTheme()));
    }
};

MapView.prototype.relativeLocation = function(loc) {
	return [loc[0]*this.getBlocksize(),loc[1]*this.getBlocksize()];
};

MapView.prototype.storeTankInfo = function(tank, node) {
    this.tanks_[tank.getId()] = {tank: tank, node: node};
};

MapView.prototype.getTank = function(tankId) {
    return this.tanks_[tankId].tank;
};

MapView.prototype.getTankNode = function(tankId) {
    return this.tanks_[tankId].node;
};

MapView.prototype.getTanks = function() {
  return this.tanks_;
};

MapView.prototype.getTheme = function() {
    return this.theme_;
};

try {
    module.exports = MapView;
} catch (err) {}