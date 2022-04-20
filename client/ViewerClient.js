var ws;
var MapView;
var Tank;
var Direction;
var ActionType;
var ActionRequestResponse;

try {
    ws = io;
} catch (err) {
}

try {
    ws = require('socket.io-client');
    Tank = require('../game/Tank.js');
    Direction = require('../game/Direction.js');
    ActionType = require('../game/ActionType.js');
    AttackResult = require('../game/AttackResult.js');
    MoveResult = require('../game/MoveResult.js');
    ActionRequestResponse = require('../game/ActionRequestResponse.js');
} catch (err) {
}

var ViewerClient = function (serverUrl) {
    this.serverUrl = serverUrl;
    this.tanks = {};
};

ViewerClient.prototype.createDisplay = function (theme) {
    this.theme_ = theme;

    // main container
    var container = document.getElementById('container');
    if (!container) {
        $container = $('<div></div>', {
            id: 'container',
            class: 'container'
        });
        $('body').append($container);
    }

    var $well = $('<div class="well fill-height"></div>');
    var $row = $('<div class="row-fluid"></div>');
    $well.append($row);
    $('#container').append($well);

    // create three rows
    var $row_inner = $('<div class="col-md-12" id="main"></div>');
    $row.append($row_inner);

    // first row (red/controls/blue
    var $row_a = $('<div class="row"></div>');
    var $red = $('<div class="col-md-4 col-sm-4" id="board-blue"></div>');
    var $controls = $('<div class="col-md-4 col-sm-4" id="game-controls"></div>');
    var $blue = $('<div class="col-md-4 col-sm-4" id="board-green"></div>');
    $row_a.append($red);
    $row_a.append($controls);
    $row_a.append($blue);
    $row_inner.append($row_a);

    // second row (map)
    var $row_b = $('<div class="row"></div>');
    $row_b.append('<div class="col-md-12 col-sm-12 text-center" id="map"></div>');
    $row_inner.append($row_b);

    // third row (green/nothing/yellow)
    var $row_c = $('<div class="row"></div>');
    var $green = $('<div class="col-md-4 col-sm-4" id="board-red"></div>');
    var $filler = $('<div class="col-md-4 col-sm-4" id="filler"></div>');
    var $yellow = $('<div class="col-md-4 col-sm-4" id="board-yellow"></div>');
    $row_c.append($green);
    $row_c.append($filler);
    $row_c.append($yellow);
    $row_inner.append($row_c);

    /*
    // lhs (end game / timer / leaderboard)
    $row.append('<div class="col-md-4 col-sm-8 fill-height" id="lhs"></div>');

    // map
    $row.append('<div class="col-md-8 col-sm-8" id="rhs"></div>');


    // TODO: create sizes here, or update responsive using bootstrap
    // adjust map height equal to the responsive width
    //$('#rhs').css('height',$('#rhs')[0].offsetWidth+'px');
    */

    this.createGameControls();
    this.createLeaderboard();

    // hookup resizer listener and only resize before game has started
    window.onresize = this.resizer.bind(this);

    this.resizer();
};

ViewerClient.prototype.resizer = function () {
    console.log('Page Resized');

    // check which is smaller
    var screenWidth = $(window).width();
    var screenHeight = $(window).height();

    // height of the top navbar
    var topnavbarHeight = 0; /*$('.navbar.navbar-default.navbar-static-top').height();*/

    // remaining height
    // TODO: adjust this
    // total viewport height - scoreboard headers - well padding
    var remainingHeight = screenHeight - 208 - 20;
    // total viewport width - map padding - well padding
    var remainingWidth = screenWidth - 15 - 20;

    if (remainingHeight < remainingWidth) {
        $('#map').height(remainingHeight);
    } else {
        $('#map').height(remainingWidth);
    }

    // reinitialise the map/leaderboard
    if (this.mapView)
        this.mapView.reinitialize_();
    /*
    if (this.leaderboardView)
        this.leaderboardView.reinitialize_();
    */

};

ViewerClient.prototype.destroyDisplay = function (done) {
    if (this.mapView) {
        $('#mapView').remove();
    }

    if (this.leaderBoardView) {
        $('#leaderboardView').remove();
    }
};

ViewerClient.prototype.createMap = function (map) {
    //$('#mapView-container').empty();

    //$mapView = $('<div id="mapView-container"></div>');
    //$('#rhs').append($mapView);
    this.mapView = new MapView($('#map')[0], map, this.getTheme());
};

ViewerClient.prototype.createGameControls = function () {
    // create panel
    var $panel = $('<div id="panel-controls" class="panel panel-primary"><div class="panel-body text-center"></div></div>');

    /*var $title = $('<h2 style="margin-top: 10px;">Timer: <span id="game-timer" class="pull-right">00:00</span></h2>');*/
    var $endGame = $('<a id="end-button" class="btn btn-danger btn-lg" role="button">End Game</a>');
    var $restartButton = $('<a id="restart-button" class="btn btn-warning btn-lg" style="display: none;" role="button">New Round</a>');
    /*$panel.find('.panel-heading').append($title);*/
    $panel.find('.panel-body').append($endGame);
    $panel.find('.panel-body').append($restartButton);

    // hookup end game button
    $endGame.click(function () {
        // TODO: can change this, just a way of showing end game
        // destroy all robots on the map
        var tanks = this.getTanks();
        for (var i = 0; i < tanks.length; i++) {
            this.mapView.animateTankDestroy(tanks[i].getId());
            this.mapView.removeTank(tanks[i].getId());
        }

        // TODO: can pass more data to the server here
        // emit stop to the server
        this.handleStartStopClick({
            /* data sent back to server upon completion here */
        });

        /*
        // enable restart button
        $('#restart-button').toggleClass('disabled', false);
        // disable end button
        $('#end-button').toggleClass('disabled', true);
        */
        // hide the end game button
        // show the new round button
        $('#end-button').hide();
        $('#restart-button').show();

    }.bind(this));

    $restartButton.click(function () {
        window.location.reload();
    }.bind(this));

    $('#game-controls').append($panel);
};

ViewerClient.prototype.createLeaderboard = function () {
    /*
    var leaderboardView = document.getElementById('leaderboardView-container');
    if (!leaderboardView) {
        $leaderboardView = $('<div></div>', {
            id: 'leaderboardView-container'
        });
        $('#lhs').append($leaderboardView);
    };
    */
    this.leaderboardView = new LeaderboardView({
        red: $('#board-red'),
        blue: $('#board-blue'),
        green: $('#board-green'),
        yellow: $('#board-yellow')
    }, 'Leaderboard', this.getTheme());
};

ViewerClient.prototype.initialise = function (onCompleteCallback) {
    this.state = GameState.NOT_STARTED;
    this.serverConnectionSocket = ws.io(this.serverUrl, {
        'reconnection delay': 0,
        'reopen delay': 0,
        'force new connection': true
    });
    this.serverConnectionSocket.on("welcome", function (res) {
        console.log('Welcome recieved from server. res:', res);
        this.createMap(res.map);
        onCompleteCallback();
    }.bind(this));
    this.serverConnectionSocket.on("actionResult", this.notificationRecieved.bind(this));
};

ViewerClient.prototype.notificationRecieved = function (actionResultData, onFinishedProcessing) {
    var actionResult = ActionRequestResponse.createFrom(actionResultData);
    this.processActionResult(actionResult, onFinishedProcessing);
};

ViewerClient.prototype.handleStartStopClick = function (gameData) {
    var dataToSend = gameData || {};
    switch (this.state) {
        case GameState.NOT_STARTED:
            this.serverConnectionSocket.emit('start', dataToSend);
            this.state = GameState.STARTED;
            return;
        case GameState.STARTED:
            this.serverConnectionSocket.emit('stop', dataToSend);
            this.state = GameState.STOPPED;
            break;
    }
};

var GameState = {
    NOT_STARTED: 0,
    STARTED: 1,
    STOPPED: 2
};

ViewerClient.prototype.processActionResult = function (actionResult, onFinishedProcessing) {
    var targetTankId = actionResult.getTankId();
    var actionResultData = actionResult.getData();

    switch (actionResult.getType()) {
        case ActionType.CREATE:
            this.createATank(actionResultData);
            break;
        case ActionType.MOVE:
            this.processMoveActionResult(targetTankId, actionResultData, onFinishedProcessing);
            break;
        case ActionType.ATTACK:
            this.processAttackActionResult(targetTankId, actionResultData, onFinishedProcessing);
            break;
        case ActionType.SCAN:
            this.processScanActionResult(targetTankId, onFinishedProcessing);
            break;
        case ActionType.RESPAWN:
            var tank = Tank.createFrom(actionResultData);
            this.storeTank(tank);
            this.mapView.addTank(tank);
            this.leaderboardView.reAddTank(tank);
            this.leaderboardView.updateTank(tank.getId());
            break;
        default:
            console.log('Before throwing error, action type:...');
            console.log(actionResult);
            throw new Error('Invalid action type! (' + actionResult + ')');
    }
};

ViewerClient.prototype.createATank = function (tankData) {
    var newTank = Tank.createFrom(tankData);
    this.storeTank(newTank);
    this.mapView.addTank(newTank);
    this.leaderboardView.addTank(newTank);
};

ViewerClient.prototype.processMoveActionResult = function (tankId, actionResultData, onFinishedProcessing) {
    if (actionResultData.result == MoveResult.MOVED) {
        this.doMove(tankId, actionResultData.direction, onFinishedProcessing);
    } else if (actionResultData.result == MoveResult.BLOCKED) {
        this.doBlockedMove(tankId, actionResultData.direction, onFinishedProcessing);
    }
};

ViewerClient.prototype.doMove = function (tankId, direction, onFinishedProcessing) {
    this.mapView.animateTankMove(tankId, direction, onFinishedProcessing);
    this.getTank(tankId).move(direction);
};

ViewerClient.prototype.doBlockedMove = function (tankId, direction, onFinishedProcessing) {
    this.mapView.animateTankBlockedMove(tankId, direction, onFinishedProcessing);
};

ViewerClient.prototype.processAttackActionResult = function (tankId, actionResultData, onFinishedProcessing) {
    var direction = actionResultData.direction;
    switch (actionResultData.result) {
        case AttackResult.MISS:
            this.doAttackMiss(tankId, direction, actionResultData.strikeLocation, actionResultData.status.ammo, onFinishedProcessing);
            break;
        case AttackResult.HIT:
            this.doAttackHit(tankId, direction, actionResultData.hitEntityId, actionResultData.points, actionResultData.damage, actionResultData.status.ammo, onFinishedProcessing);
            break;
        case AttackResult.DESTROYED:
            this.doAttackHit(tankId, direction, actionResultData.hitEntityId, actionResultData.points, actionResultData.damage, actionResultData.status.ammo, (function () {
                // after hit, do destroy
                this.doTankDestroy(actionResultData.hitEntityId, onFinishedProcessing);
            }).bind(this));
            break;
        case AttackResult.OOA:
            this.doAttackOom(tankId, direction, onFinishedProcessing);
            break;
    }
};

ViewerClient.prototype.doAttackMiss = function (tankId, direction, strikeLocation, ammo, onFinishedProcessing) {
    this.getTank(tankId).setAmmo(ammo);
    this.mapView.animateTankAttack(tankId, direction, strikeLocation);
    if (onFinishedProcessing) onFinishedProcessing();
};

ViewerClient.prototype.doAttackHit = function (tankId, direction, hitEntityId, points, damage, ammo, onFinishedProcessing) {
    this.getTank(tankId).scoreIncreasesBy(points);
    this.getTank(tankId).setAmmo(ammo);

    var hitEntityTank = this.getTank(hitEntityId);
    if (hitEntityTank) {
        this.getTank(hitEntityId).setHealth(hitEntityTank.getHealth() - damage);
        this.mapView.animateTankAttack(tankId, direction, hitEntityTank.getLocation());

        this.leaderboardView.updateTank(tankId, false); // after second call
        this.leaderboardView.updateTank(hitEntityId, true);
    } else {
        console.log('the hit entity wasnt recorded as a TANK, probably hit a target?');
        console.log('args: [' + tankId + ',' + direction + ',' + hitEntityId + ',' + points + ',' + damage + ']');
    }

    if (onFinishedProcessing) onFinishedProcessing();
};

ViewerClient.prototype.doTankDestroy = function (tankId, onFinishedProcessing) {
    this.mapView.animateTankDestroy(tankId);
    if (onFinishedProcessing) onFinishedProcessing();
};

ViewerClient.prototype.doAttackOom = function (tankId, direction, onFinishedProcessing) {
    this.mapView.animateTankOom(tankId, direction);
    if (onFinishedProcessing) onFinishedProcessing();
}

ViewerClient.prototype.processScanActionResult = function (tankId, onFinishedProcessing) {
    this.mapView.animateTankScan(tankId);
    if (onFinishedProcessing) onFinishedProcessing();
};

/* Setup game state */
ViewerClient.prototype.setGameState = function (robots) {
    // TODO:
    //this.createDisplay();

    // add each robot
    for (var i = 0; i < robots.length; i++) {
        this.tanks[robots[i].getId()] = robots[i];
        this.mapView.addTank(robots[i]);
    }
};

ViewerClient.prototype.closeSocket = function () {
    if (this.serverConnectionSocket && this.serverConnectionSocket.socket.connected) {
        this.serverConnectionSocket.disconnect();
    }
};

ViewerClient.prototype.getMapView = function () {
    return this.mapView;
};

ViewerClient.prototype.getLeaderboardView = function () {
    return this.leaderboardView;
};

ViewerClient.prototype.storeTank = function (newTank) {
    this.tanks[newTank.getId()] = newTank;
};

ViewerClient.prototype.getTanks = function (newTank) {
    var tanks = [];
    for (var k in this.tanks) {
        tanks.push(this.tanks[k]);
    }
    return tanks;
};

ViewerClient.prototype.getTank = function (tankId) {
    return this.tanks[tankId];
};

ViewerClient.prototype.getTheme = function () {
    return this.theme_;
};

try {
    module.exports = ViewerClient;
} catch (err) {
}

