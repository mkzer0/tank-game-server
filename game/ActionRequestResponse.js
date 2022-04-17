
var ActionRequestResponse = function(tankId, type, data) {
	this.tankId_ = tankId;
	this.type_ = type;
	this.data_ = data;
};

ActionRequestResponse.prototype.getTankId = function() {
	return this.tankId_;
};

ActionRequestResponse.prototype.getType = function() {
	return this.type_;
};

ActionRequestResponse.prototype.getData = function() {
	return this.data_;
};

ActionRequestResponse.createFrom = function(object) {
	return new ActionRequestResponse(object.tankId_, object.type_, object.data_);
};

ActionRequestResponse.createFromExpressRequest = function(request) {
  return ActionRequestResponse.createFrom(request.body);
};

try {
  module.exports = ActionRequestResponse;
} catch (err) {}