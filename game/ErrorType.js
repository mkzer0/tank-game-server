
var ErrorType = {
  GAME_NOT_IN_PROGRESS:     0,
  HAS_DIED:                 1,
  ALREADY_SCHEDULED_ACTION: 2,
  MULTIPLE_TANK_REQUESTS:   3,
  INVALID_TANK_COLOUR:      4,
  SERVER_ERROR:             5,
  GAME_IN_PROGRESS:         6

};

try {
  module.exports = ErrorType
} catch (err) {}