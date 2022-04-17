 
var ActionType = {
	CREATE:       0,
	MOVE: 		    1,
	ATTACK: 	    2,
  SCAN:         3,
  STATUS_CHECK: 4,
  RESPAWN:      5
};

try {
  module.exports = ActionType
} catch (err) {}