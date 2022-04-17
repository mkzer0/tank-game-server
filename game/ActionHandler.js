
ActionHandler = function() {
};

ActionHandler.prototype.handleNextEntityAction = function(entity) {
	var action = entity.dequeueAction();
	this.processAction(entity, action);
};

module.exports = ActionHandler;