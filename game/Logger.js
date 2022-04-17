
var path = require('path');

var Logger = function() {}


Logger.prototype.log = function(message, object) {
  if (path.basename(require.main.filename) == 'main.js') {
    this.writeToConsole(message, object);
  }
};

Logger.prototype.writeToConsole = function(message, object) {
  if (object) {
    console.log('[INFO] ---> '+message, object);
  } else {
    console.log('[INFO] ---> '+message);
  }
};

module.exports = Logger;