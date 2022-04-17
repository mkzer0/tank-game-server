
 var LeaderboardView = function(parent, title, theme) {
    this.parent_ = parent;
    this.title_ = title;
    this.theme_ = theme;
    this.initialize_();
};

LeaderboardView.prototype.initialize_ = function() {
    this.reinitialize_();
};

LeaderboardView.prototype.reinitialize_ = function() {
    // clear out previous
    //$('#leaderboardView-container').empty();
    
    this.parent_.blue.empty();
    this.parent_.green.empty();
    this.parent_.red.empty();
    this.parent_.yellow.empty();
    
    //$('#leaderboardView-container').height($('#lhs').height()-$('#panel-controls').height()-20-20);
    
    // create stores
    this.boards_ = {};

    /*var $panel = $('<div class="panel panel-primary"></div>');
    var $heading = $('<div class="panel-heading fill-height"><h2 style="margin-top: 10px;">Leaderboard</h2></div>');
    var $body = $('<div class="panel-body"></div>');
    
    var $table = $('<table class="table"><thead><tr>'+
        //'<th>#</th>'+
        '<th>Tank</th>'+
        '<th>Ammo</th>'+
        '<th>Score</th>'+
        '</tr></thead><tbody id="board-table-body"></tbody></table');

    $panel.append($heading);
    $panel.append($body);
    $body.append($table);
    
    $('#leaderboardView-container').append($panel);
    */
};

LeaderboardView.prototype.createBoardTables = function() {
    /*
    this.parent_.blue.append($('<table class="table"><thead></thead>'+
                               '<tbody id="board-blue-table">'+
                             '<tr><td data-for="name"></td><td data-for="score"></td></tr>'+
                              '<tr><td data-for="health" colspan="2"></td></tr>'+
                               '</tbody></table>'));
    this.parent_.green.append($('<table class="table"><thead></thead>'+
                                '<tbody id="board-green-table">'+
                              '<tr><td data-for="name"></td><td data-for="score"></td></tr>'+
                              '<tr><td data-for="health" colspan="2"></td></tr>'+
                                '</tbody></table>'));
    this.parent_.yellow.append($('<table class="table"><thead></thead>'+
                                 '<tbody id="board-yellow-table">'+
                               '<tr><td data-for="name"></td><td data-for="score"></td></tr>'+
                              '<tr><td data-for="health" colspan="2"></td></tr>'+
                                 '</tbody></table>'));
                                 */
};

LeaderboardView.prototype.getHeading = function() {
    //return this.headingContainer_;
};

LeaderboardView.prototype.getBoardContainer = function() {
    //return this.boardContainer_;
};

LeaderboardView.prototype.getBoardFor = function(tank) {
    return $('#board-'+tank.getColour().toLowerCase());
};

LeaderboardView.prototype.addTank = function(tank) {
    var board = new Board(this.getBoardFor(tank), tank);

    // store
    this.addBoardStore(tank.getId(), board);

    tank.setBoard(board);
    return board;
};

 LeaderboardView.prototype.reAddTank = function(tank) {
   var board = this.getBoard(tank.getId());
   board.tank_ = tank;
   this.addBoardStore(tank.getId(), board);
   tank.setBoard(board);
 };

LeaderboardView.prototype.updateTank = function(tankId, reOrder) {
    //this.tanks_[tankId].getBoard().updateStatus(true);
    this.getBoard(tankId).updateStatus(reOrder);
};

/*
LeaderboardView.prototype.updateRanks = function() {

};
*/

LeaderboardView.prototype.getBoardStore = function() {
    return this.boards_;
};
LeaderboardView.prototype.getBoard = function(tankId) {
    return this.boards_[tankId];
};

LeaderboardView.prototype.addBoardStore = function(tankId, store) {
    this.boards_[tankId] = store;
};

/*
LeaderboardView.prototype.getBoardStoreInRankOrder = function() {
    var keys = [];
    for(var k in this.getBoardStore()) keys.push(k);

    // sort through boards
    // push first one
    var inOrder = [this.getBoard(keys[0])];
    for (var i=1; i < keys.length; i++) {
        // sort
    }

    return [
        this.getBoard(keys[0]),
        this.getBoard(keys[1]),
        this.getBoard(keys[2]),
        this.getBoard(keys[3])
    ];
};
*/

function Board(parent, tank) {
    this.parent_ = parent;
    this.tank_ = tank;

    // store original health for later
    this.currentHealth_ = this.tank_.getHealth();


    var $table = $('<table class="table"><thead></thead>'+
      '<tbody>'+
      '<tr><td id="name"></td><td id="score"></td></tr>'+
      '<tr><td id="health" colspan="2"></td></tr>'+
      '</tbody></table>');
    parent.append($table);

    
    /*
    // create a new table row for the tank
    var $table = $('#board-table-body');
    var $row = $('<tr id="'+this.tank_.getId()+'-board">'+
        //'<td data-for="rank"></td>'+
        '<td data-for="name"></td>'+
        '<td data-for="ammo"></td>'+
        '<td data-for="score"></td>'+
        '</tr>');
    var $health_row = $('<tr><td style="border-top: none" colspan="4" data-for="health-row"></td></tr>');
    $table.append($row);
    $table.append($health_row);
    */

    //this.rankElement_ = $row.children('[data-for="rank"]')[0];
    //this.ammoElement_ = $row.children('[data-for="ammo"]')[0];
    this.nameElement_ = $table.find('#name');
    this.scoreElement_ = $table.find('#score');
    this.healthElement_ = $table.find('#health');

    // update name initially, only needs to be done once
    this.updateName(this.tank_.getName());
  
    // update details
    this.updateStatus(false);
};

Board.prototype.getElement = function() {
    return this.element_;
};

Board.prototype.getTank = function() {
    return this.tank_;
};

Board.prototype.updateStatus = function(reOrder) {
    // this.updateName(this.tank_.getName());
    this.updateHealth(this.tank_.getHealth());
    this.updateAmmo(this.tank_.getAmmo());
    this.updateScore(this.tank_.getScore());
    
    // set ranks
    /*
    if (reOrder) {
        this.parent_.updateRanks();
    }
    */
};

Board.prototype.updateRank = function(rank) {
    /*
    $(this.rankElement_).empty();
    $(this.rankElement_).append($('<p class="lead leaderboard-details">'+rank+'</p>'));
    */
};

Board.prototype.updateName = function(name) {
    $(this.nameElement_).empty();

    //this.nameElement_.innerHTML = name;
    $(this.nameElement_).append($('<img class="leaderboard-tankimage" src="'+
        Theme.getTankImage(this.getTheme(),this.tank_.getColour())+'">'));
    $(this.nameElement_).append($('<h1 class="lead leaderboard-details" style="margin-top: 0px; font-size: 12pt;">'+name+'</h1>'));
};

Board.prototype.updateAmmo = function(ammo) {
    /*
    var ammoString = (ammo >= 0)?ammo:'&infin;';
    $(this.ammoElement_).empty();
    $(this.ammoElement_).append($('<p class="lead leaderboard-details">'+ammoString+'</p>'));
    */
}

Board.prototype.updateScore = function(score) {
    $(this.scoreElement_).empty();
    $(this.scoreElement_).append($('<p class="lead leaderboard-details">'+score+'</p>'));
};

Board.prototype.updateHealth = function(hp) {
    $(this.healthElement_).empty(); 
    if (hp != 0) {
        $health_progress_bar = $('<div class="progress leaderboard-health"><div class="progress-bar healthbar-'+this.tank_.getColour()+'" '+
            'aria-valuenow="'+hp+'" aria-valuemin="0" aria-valuemax="100" style="width: '+hp+'%"></div></div>');
        $(this.healthElement_).append($health_progress_bar);
    } else {
        $(this.healthElement_).append($('<p class="lead leaderboard-details leaderboard-dead">DEAD</p>'));
        // TODO: do we want anything special when dead?
    }
};

Board.prototype.getTheme = function() {
    return this.theme_;
}

try {
  module.exports = LeaderboardView;
} catch (err) {}