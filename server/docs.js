var actionDelays = require('../game/GameWorld.js').delayTime;

module.exports = {
  docs: [
    {
      id: 'TankProvider',
      title: 'TankProvider - TankProviderInterface - ITankProvider',
      body:
        'The Tank Provider Interface contains a single public function "RequestTank". ' +
        'The RequestTank function will always return a single instance of a <a href="#Tank">Tank</a> interface object.',
      sig: {
        java: 'public TankInterface requestTank(String ip, int port, TankColour colour)',
        cs: 'public ITank RequestTank(string ip, int port, TankColour colour)'
      },
      example: {
        java:
          'TankProviderInterface tankProvider = new TankProvider();\n' +
          'tankProvider.requestTank("INSERT SERVER IP HERE", 9999, TankColour.RED);',
        cs:
          'ITankProvider tankProvider = new TankProvider();\n' +
          'tankProvider.requestTank("INSERT SERVER IP HERE", 9999, TankColour.RED);'
      }
    },
    {
      id: 'Tank',
      title: "Tank - TankInterface - ITank",
      body:
        'The Tank contains the three main functions that can be used to interact with your Tank they are ' +
        '<a href="#Move">Move</a>, <a href="#Scan">Scan</a>, and <a href="#Fire">Fire</a>. Each action has' +
        'a delay before its executed and after its executed before the results are returned to the requester.',
      methods: [
        {
          id: 'Move',
          title: 'Move',
          body: 'Move the tank one space in the specified direction.' +
            '<br> The before delay is '+actionDelays.beforeMove+'ms.' +
            '<br> The after delay is '+actionDelays.afterMove+'ms.',
          sig: {
            java: 'public MoveActionData move(Direction d)',
            cs: 'public MoveActionData Move(Direction d)'
          },
          example: {
            java: 'MoveActionData moveData = myTank.move(Direction.NORTH);',
            cs: 'MoveActionData moveData = myTank.Move(Direction.EAST);'
          }
        },
        {
          id: 'Scan',
          title: 'Scan',
          body: 'Detect the next closest object in each of the four directions. NOTE: No limitation on range.' +
            '<br> The before delay is '+actionDelays.beforeScan+'ms.' +
            '<br> The after delay is '+actionDelays.afterScan+'ms.',
          sig: {
            java: 'public ScanActionData scan()',
            cs: 'public ScanActionData Scan()'
          },
          example: {
            java: 'ScanActionData scanData = myTank.scan();',
            cs: 'ScanActionData scanData = myTank.Scan();'
          }
        },
        {
          id: 'Fire',
          title: 'Fire',
          body: 'Fire a bullet in the specified direction. NOTE: No limitation on range.' +
            '<br> The before delay is '+actionDelays.beforeAttack+'ms.' +
            '<br> The after delay is '+actionDelays.afterAttack+'ms.',
          sig: {
            java: 'public FireActionData fire(Direction d)',
            cs: 'public FireActionData Fire(Direction d)'
          },
          example: {
            java: 'FireActionData fireData = myTank.fire(Direction.SOUTH);',
            cs: 'FireActionData fireData = myTank.Fire(Direction.WEST);'
          }
        }
      ],
      sig: {
        java: '',
        cs: ''
      },
      example: {
        java: '',
        cs: ''
      }
    },
    {
      id: 'Direction',
      title: 'Direction',
      body:
        'The Direction enum is used to depict the cardinal direction of actions or responses. ' +
          'North is the top of the screen.',
      sig: {
        java: 'Direction.NORTH == 0, Direction.EAST == 1, Direction.SOUTH == 2, Direction.WEST == 3',
        cs: 'Direction.NORTH == 0, Direction.EAST == 1, Direction.SOUTH == 2, Direction.WEST == 3'
      },
      example: {
        java:
          'myTank.move(Direction.NORTH);\n' +
          'myTank.fire(Direction.EAST);\n' +
          'ScanActionData scanData;\n' +
          'scanData.result(Direction.SOUTH);',
        cs:
          'myTank.Move(Direction.NORTH);\n' +
          'myTank.Fire(Direction.EAST);\n' +
          'ScanActionData scanData;\n' +
          'scanData.result(Direction.SOUTH);'
      }
    },
    {
      id: 'ActionData',
      title: 'ActionData and TankStatus',
      body:
        'The ActionData object is the super class of all other ActionData types. It contains a TankStatus ' +
        'object with three members. Health, ammo, and score. Tanks have 100 health when they spawn. Every time ' +
        'you make a request a TankStatus is returned along with it.',
      sig: {
        java: 'public class ActionData {\n' +
          'public TankStatus status;\n' +
          '}',
        cs: 'public class ActionData {\n' +
          'public TankStatus status;\n' +
          '}'
      },
      example: {
        java:
          'TankStatus myTankStatus = anyActionData.status;\n' +
          'if (myTankStatus.health <= 40) runAway();\n' +
          'if (myTankStatus.ammo <= 3) saveAmmo();\n' +
          'if (myTankStatus.score >= 0) winning();',
        cs:
          'TankStatus myTankStatus = anyActionData.status;\n' +
          'if (myTankStatus.health <= 40) runAway();\n' +
          'if (myTankStatus.ammo <= 3) saveAmmo();\n' +
          'if (myTankStatus.score >= 0) winning();'
      }
    },
    {
      id: 'MoveActionData',
      title: 'MoveActionData',
      body:
        'The MoveActionData response object is the object returned from a <a href="#Move">Move</a> action request. ' +
        'It provides the result of the <a href="#Move">Move</a> action here as a <a href="#MoveResult">MoveResult</a>. It also e',
      sig: {
        java: 'public class MoveActionData extends ActionData {\n' +
          'public MoveResult result;\n' +
          'public Direction direction;\n' +
          '}',
        cs: 'public class MoveActionData : ActionData {\n' +
          'public MoveResult result;\n' +
          'public Direction direction;\n' +
          '}'
      },
      example: {
        java:
          'if (moveActionData.result == MoveResult.BLOCKED) doSomethingDifferent();\n' +
            'if (moveActionData.result == MoveResult.MOVED) onwards();\n',
        cs:
          'if (moveActionData.result == MoveResult.BLOCKED) DoSomethingDifferent();\n' +
            'if (moveActionData.result == MoveResult.MOVED) Onwards();\n'
      }
    },
    {
      id: 'MoveResult',
      title: 'MoveResult',
      body:
        'The MoveResult enum is used to indicate the result of a <a href="#Move">Move</a> action.',
      sig: {
        java: 'MoveResult.BLOCKED, MoveResult.MOVED',
        cs: 'MoveResult.BLOCKED, MoveResult.MOVED'
      },
      example: {
        java:
          'MoveActionData moveActionData;\n' +
            'if (moveData.result == MoveResult.BLOCKED) return;',
        cs:
          'MoveActionData moveActionData;\n' +
            'if (moveData.result == MoveResult.BLOCKED) return;'
      }
    },
    {
      id: 'ScanActionData',
      title: 'ScanActionData',
      body:
        'The ScanActionData response contains a "result" field of type <a href="#ScanData">ScanData</a>[] which ' +
          'gives the nearest entity as described by <a href="#EntityType">EntityType</a> in each ' +
          'direction. You can index into the array by using the <a href="#Direction">Direction</a> enum or by calling the ' +
          'the result function.',
      sig: {
        java: 'public class ScanActionData extends ActionData {\n' +
          'public ScanData[] result;\n' +
          '}',
        cs: 'public class ScanActionData : ActionData {\n' +
          'public ScanData[] result;\n' +
          '}'
      },
      example: {
        java:
          'ScanData[] scanResult = scanActionData.result;\n' +
            'ScanData northData = scanResult[Direction.NORTH];\n' +
            '// OR\n' +
            'ScanData southData = scanResult.result(Direction.NORTH);',
        cs:
          'ScanData[] scanResult = scanActionData.result;\n' +
            'ScanData northData = scanResult[Direction.NORTH];\n' +
            '// OR\n' +
            'ScanData southData = scanResult.Result(Direction.NORTH);'
      },
      methods: [
        {
          id: 'ScanActionData.Result',
          title: 'ScanActionData.Result',
          body: 'Result retrieves a <a href="#ScanData">ScanData</a> object for a particular <a href="#Direction">Direction</a> from the result array.',
          sig: {
            java: 'public ScanData result(Direction d);',
            cs: 'public ScanData Result(Direction d);'
          },
          example: {
            java: 'ScanData scanData = myScanActionData.result(Direction.EAST);',
            cs: 'ScanData scanData = myScanActionData.result(Direction.EAST);'
          }
        }
      ]
    },
    {
      id: 'ScanData',
      title: 'ScanData',
      body:
        'The ScanData object gives you information about what was detected in a particular direction.',
      sig: {
        java: 'ScanData data;\n' +
          'data.entityType; // The type of entity detected see below.\n' +
          'data.distance; // Number of spaces between tank and scanned entity.\n' +
          'data.direction // Direction that this result came from.',
        cs: 'ScanData data;\n' +
          'data.entityType; // The type of entity detected see below.\n' +
          'data.distance; // Number of spaces between tank and scanned entity.\n' +
          'data.direction // Direction that this result came from.'
      },
      example: {
        java: '',
        cs: ''
      }
    },
    {
      id: 'EntityType',
      title: 'EntityType',
      body:
        'The EntityType enum is used to indicate what type of entity was detected from a <a href="#Scan">Scan</a> action.',
      sig: {
        java: 'EntityType.WALL, Direction.TANK',
        cs: 'EntityType.WALL, Direction.TANK'
      },
      example: {
        java:
          'if (scanData.Result(Direction.NORTH).entityType == EntityType.WALL) goAroundTheWall();\n' +
            'if (scanData.result(Direction.NORTH).entityType == EntityType.TANK) Shoot();',
        cs:
          'if (scanData.result(Direction.SOUTH).entityType == EntityType.WALL) goAroundTheWall();\n' +
            'if (scanData.result(Direction.NORTH).entityType == EntityType.TANK) Shoot();'
      }
    },
    {
      id: 'FireActionData',
      title: 'FireActionData',
      body:
        'The FireActionData response object is the object returned from a <a href="#Fire">Fire</a> action request. ' +
          'It provides the result of the <a href="#Fire">Fire</a> action here as a <a href="#FireResult">FireResult</a>. It also e',
      sig: {
        java: 'public class FireActionData extends ActionData {\n' +
          'public TankStatus status;\n' +
          'public FireResult result;\n' +
          'public Direction direction;\n' +
          'public int points;\n' +
          'public int damage;\n' +
          '}',
        cs: 'public class FireActionData : ActionData {\n' +
          'public TankStatus status;\n' +
          'public FireResult result;\n' +
          'public Direction direction;\n' +
          'public int points;\n' +
          'public int damage;\n' +
          '}'
      },
      example: {
        java:
          'if (fireActionData.result == FireResult.MISSED) doSomethingDifferent();\n' +
            'if (fireActionData.result == FireResult.HIT) fireAgain();\n',
        cs:
          'if (fireActionData.result == FireResult.MISSED) DoSomethingDifferent();\n' +
            'if (fireActionData.result == FireResult.HIT) FireAgain();\n'
      }
    },
    {
      id: 'FireResult',
      title: 'FireResult',
      body:
        'The FireResult enum is used to indicate the result of a  <a href="#Fire">Fire</a> action.',
      sig: {
        java: 'FireResult.MISSED, FireResult.HIT, FireResult.DESTROYED, FireResult.OUT_OF_AMMO',
        cs: 'FireResult.MISSED, FireResult.HIT, FireResult.DESTROYED, FireResult.OUT_OF_AMMO'
      },
      example: {
        java:
          'FireActionData fireActionData;\n' +
          'if (fireActionData.result == FireResult.MISSED) return;\n' +
          'if (fireActionData.result == FireResult.HIT) return;\n' +
          'if (fireActionData.result == FireResult.DESTROYED) return;\n' +
          'if (fireActionData.result == FireResult.OUT_OF_AMMO) return;',
        cs:
          'FireActionData fireActionData;\n' +
          'if (fireActionData.result == FireResult.MISSED) return;\n' +
          'if (fireActionData.result == FireResult.HIT) return;\n' +
          'if (fireActionData.result == FireResult.DESTROYED) return;\n' +
          'if (fireActionData.result == FireResult.OUT_OF_AMMO) return;'
      }
    },
    {
      id: 'Exceptions',
      title: 'Exceptions',
      body:
        'The TankProviderInterface function (requestTank()) as well as each of the TankInterface functions ' +
        '(move(), scan(), fire()) each can throw the following Runtime Exceptions:' +
        '</p><ul>' +
        '<li>TankDeadException: Is thrown when you make a request and the tank is dead.<br>' +
          'However its only thrown once the following request is blocked till the tank respawns and then is honoured.</li>' +
        '<li>TankGameException: Is thrown when anything else unexpected happens.<br>' +
          'You can catch this in order to reset and re-attemp actions with your tank.<br>' +
          'Or when the game has ended and you have tried to keep going.</li>' +
        '</ul><p>' +
        'The most important exception of these is the TankDeadException. It is a means of ' +
        'determining when your tank dies while making a request.',
      sig: {
        java: 'TankDeadException extends RuntimeException {...}\n' +
          'TankGameException extends RuntimeException{...}',
        cs: 'TankDeadException extends Exception {...}\n' +
          'TankGameException extends Exception {...}'
      },
      example: {
        java:
          'try {\n' +
          '    myTank.move(Direction.EAST)\n' +
          '} catch (TankDeadException ex) {\n' +
          '    resetAI()\n' +
          '}',
        cs:
          'try {\n' +
          '    myTank.Move(Direction.EAST)\n' +
          '} catch (TankDeadException ex) {\n' +
          '    resetAI()\n' +
          '}'
      }
    }
  ]
};