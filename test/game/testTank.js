var Tank = require("../../game/Tank.js");
var Direction = require("../../game/Direction.js");
var Assert = require("assert");

describe("Tank", function() {
	var testTank;

	beforeEach(function() {
		testTank = new Tank(0, "TestTank", { x: 0, y: 0 }, "TestColour");;
	});

	describe("move(direction)", function() {
		it("should move the tank one unit north when north is the direction specified", function() {
			var start = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(start, "testTank position is undefined.");
			testTank.move(Direction.NORTH);
			var end = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(end, "testTank position is undefined.");
			Assert.equal(end.y, start.y-1, "Resulting y coordinate: "+end.y+" should be "+(start.y-1)+"!");
			Assert.equal(end.x, start.x, "Resulting x coordinate not correct!");
		});
		it("should move the tank one unit east when east is the direction specified", function() {
			var start = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(start, "testTank position is undefined.");
			testTank.move(Direction.EAST);
			var end = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(end, "testTank position is undefined.");
			Assert.equal(end.y, start.y, "Resulting y coordinate not correct!");
			Assert.equal(end.x, start.x+1, "Resulting x coordinate not correct!");
		});
		it("should move the tank one unit south when south is the direction specified", function() {
			var start = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(start, "testTank position is undefined.");
			testTank.move(Direction.SOUTH);
			var end = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(end, "testTank position is undefined.");
			Assert.equal(end.y, start.y+1, "Resulting y coordinate not correct!");
			Assert.equal(end.x, start.x, "Resulting x coordinate not correct!");
		});
		it("should move the tank one unit west when west is the direction specified", function() {
			var start = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(start, "testTank position is undefined.");
			testTank.move(Direction.WEST);
			var end = { x: testTank.position_.x, y: testTank.position_.y };
			Assert.ok(end, "testTank position is undefined.");
			Assert.equal(end.y, start.y, "Resulting y coordinate not correct!");
			Assert.equal(end.x, start.x-1, "Resulting x coordinate not correct!");
		});
		it("should throw an error when not given a valid direction", function() {
			Assert.throws(function() {
				testTank.move(junk);
			});
		});
	});
});