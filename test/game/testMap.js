var Map = require('../../game/Map.js');
var TestMapData = require('../../game/MapData.js');
var Direction = require('../../game/Direction.js');
var EntityType = require('../../game/EntityType.js');
var Tank = require('../../game/Tank.js');
var Target = require('../../game/Target.js');

var Sinon = require('sinon');
var Chai = require('chai');
var should = Chai.should();
var expect = Chai.expect;
var SinonChai = require("sinon-chai");
Chai.Assertion.includeStack = true;
Chai.use(SinonChai);

describe('Map', function() {
	var testMap;
	
	beforeEach(function() {
		testMap = new Map('../test/game/mapFixtures.js', 1);
	});

	describe('new Map(data)', function() {
		it('should store the data specified as a 2 dimensional array of numbers', function() {
			var map = new Map('../test/game/mapFixtures.js', 0);
			expect(map).to.be.ok;
			expect(map.getMap()).deep.eql([[1, 0, 1],[1, 0, 0],[0, 0, 1]]);
		});
	});

	describe('getEntityAt(position)', function() {
		it('should return the entityType and the entity at the position specifed', function() {
			var entity = testMap.getEntityAt({x: 0, y: 7});
			expect(entity).to.include.keys(['entityType', 'entity']);
		});
		it('should return the entityType WALL and null when the entity is a WALL', function() {
			var expectedResult = {
				entityType: EntityType.WALL,
				entity: 	null
			};
			var entity = testMap.getEntityAt({x: 0, y: 7});
			expect(entity).to.deep.eql(expectedResult);
		});
		it('should return the entityType HILL and Hill Entity when the entity is a HILL', function() {
			var expectedResult = {
				entityType: EntityType.HILL,
				entity: 	{ state: 0, owner: 0 }
			};
			var entity = testMap.getEntityAt({x: 10, y: 10});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_1_EAST', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_1_EAST, false)
			};
			var entity = testMap.getEntityAt({x: 1, y: 10});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_2_EAST', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_2_EAST, false)
			};
			var entity = testMap.getEntityAt({x: 5, y: 6});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_1_WEST', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_1_WEST, false)
			};
			var entity = testMap.getEntityAt({x: 17, y: 8});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_2_WEST', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_2_WEST, false)
			};
			var entity = testMap.getEntityAt({x: 13, y: 12});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_1_NORTH', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_1_NORTH, false)
			};
			var entity = testMap.getEntityAt({x: 10, y: 17});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_2_NORTH', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_2_NORTH, false)
			};
			var entity = testMap.getEntityAt({x: 6, y: 13});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_1_SOUTH', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_1_SOUTH, false)
			};
			var entity = testMap.getEntityAt({x: 8, y: 1});
			expect(entity).to.deep.eql(expectedResult);
		});
		it.skip('should return the entityType TARGET and the Target Entity when the entity is a TARGET - LEVEL_2_SOUTH', function() {
			var expectedResult = {
				entityType: EntityType.TARGET,
				entity: 	new Target(Target.TargetIds.LEVEL_2_SOUTH, false)
			};
			var entity = testMap.getEntityAt({x: 12, y: 5});
			expect(entity).to.deep.eql(expectedResult);
		});
		it('should return the entityType TANK and the Tank Entity when the entity is a TANK', function() {
			testMap.addTank(new Tank('testId', 'test', {x: 2, y: 1}, 'testColor'));
			var expectedResult = {
				entityType: EntityType.TANK,
				entity: 	new Tank('testId', 'test', {x: 2, y: 1}, 'testColor')
			};
			var entity = testMap.getEntityAt({x: 2, y: 1});
			expect(entity).to.deep.eql(expectedResult);
		});
		it('should throw an error when an invalid position is supplied', function() {
			expect(function() {
				testMap.getEntityAt({x: -1, y: 0});
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt({x: 0, y: -1});
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt({x: testMap.xLimit_, y: 0});
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt({x: 0, y: testMap.yLimit_});
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt({});
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt(null);
			}).to.throw('Invalid position!');
			expect(function() {
				testMap.getEntityAt(undefined);
			}).to.throw('Invalid position!');
		});
	});

	describe('getNextEntityFrom(position, direction)', function() {
		it('should return an object with origin, direction, distance, and entityType fields', function() {
			var result = testMap.getNextEntityFrom({x: 0, y: 0}, Direction.SOUTH);
			expect(result).to.include.keys(['origin', 'direction', 'distance', 'entityType']);
		});

		describe('where the position is on the edge of the map', function() {
			var targetEntity = EntityType.WALL;

      describe('when detecting the edge of the map at a distance greater than 0', function() {
        it('should return wall entity type - NORTH', function() {
          var position = {x: 3, y: 3};
          var result = testMap.getNextEntityFrom(position, Direction.NORTH);
          expect(result).to.be.ok;
          expect(result).to.deep.eql({
            origin: position,
            direction: Direction.NORTH,
            distance: 2,
            entityType: targetEntity
          });
        });

        it('should return wall entity type - EAST', function() {
          var position = {x: 17, y: 3};
          var result = testMap.getNextEntityFrom(position, Direction.EAST);
          expect(result).to.be.ok;
          expect(result).to.deep.eql({
            origin: position,
            direction: Direction.EAST,
            distance: 2,
            entityType: targetEntity
          });
        });

        it('should return wall entity type - SOUTH', function() {
          var position = {x: 3, y: 17};
          var result = testMap.getNextEntityFrom(position, Direction.SOUTH);
          expect(result).to.be.ok;
          expect(result).to.deep.eql({
            origin: position,
            direction: Direction.SOUTH,
            distance: 2,
            entityType: targetEntity
          });
        });

        it('should return wall entity type - WEST', function() {
          var position = {x: 3, y: 3};
          var result = testMap.getNextEntityFrom(position, Direction.WEST);
          expect(result).to.be.ok;
          expect(result).to.deep.eql({
            origin: position,
            direction: Direction.WEST,
            distance: 2,
            entityType: targetEntity
          });
        });
      });

			it('should return a distance of 0 to a wall - NORTH wall', function() {
				var position = {x: 1, y: 1};
				var result = testMap.getNextEntityFrom(position, Direction.NORTH);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: Direction.NORTH,
					distance: 0,
					entityType: targetEntity
				});
			});

			it('should return a distance of 0 to a wall - EAST wall', function() {
				var position = {x: testMap.xLimit_-2, y: testMap.yLimit_-2};
				var result = testMap.getNextEntityFrom(position, Direction.EAST);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: Direction.EAST,
					distance: 0,
					entityType: targetEntity
				});
			});

			it('should return a distance of 0 to a wall - SOUTH wall', function() {
				var position = {x: testMap.xLimit_-2, y: testMap.yLimit_-2};
				var result = testMap.getNextEntityFrom(position, Direction.SOUTH);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: Direction.SOUTH,
					distance: 0,
					entityType: targetEntity
				});
			});

			it('should return a distance of 0 to a wall - WEST wall', function() {
				var position = {x: 1, y: 1};
				var result = testMap.getNextEntityFrom(position, Direction.WEST);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: Direction.WEST,
					distance: 0,
					entityType: targetEntity
				});
			});
		});

		describe('where the origin is inline with a wall but it is some distance away and is not the edge of the map', function() {
			var position = {x: 8, y: 8};
			var targetEntity = EntityType.WALL;
			it('should return the distance to the wall NORTH', function() {
				var direction = Direction.NORTH;
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 1,
					entityType: targetEntity
				});
			});
			it('should return the distance to the wall EAST', function() {
				var direction = Direction.EAST;
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 5,
					entityType: targetEntity
				});
			});
			it('should return the distance to the wall SOUTH', function() {
				var direction = Direction.SOUTH;
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 5,
					entityType: targetEntity
				});
			});
			it('should return the distance to the wall WEST', function() {
				var direction = Direction.WEST;
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 1,
					entityType: targetEntity
				});
			});
		});

		describe('where the origin is inline with a target', function() {
			var position = {x: 8, y: 7};
			var targetEntity = EntityType.TARGET;
			var direction = Direction.WEST;
			it.skip('should return the distance to the target', function() {
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 1,
					entityType: targetEntity
				});
			});
		});

		describe('where the origin is inline with a tank', function() {
			var position = {x: 8, y: 8};
			var targetEntity = EntityType.TANK;
			var direction = Direction.SOUTH;
			it('should return the distance to the tank', function() {
				testMap.addTank( new Tank('testId', 'test', {x: 8, y: 13} ) );
				var result = testMap.getNextEntityFrom(position, direction);
				expect(result).to.be.ok;
				expect(result).to.deep.eql({
					origin: position,
					direction: direction,
					distance: 4,
					entityType: targetEntity
				});
			});
		});

	});
});