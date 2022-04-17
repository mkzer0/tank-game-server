function Theme() {};

var enableAudio = true;

var theme = {
	"default": {
		"tank": {
			"blue": "../resources/tank-blue.png",
			"green": "../resources/tank-green.png",
			"yellow": "../resources/tank-yellow.png",
			"red": "../resources/tank-red.png",
			"dead": "../resources/tank-dead.png"
		},
		"objects": {
			"floor": "../resources/mud.png",
			"floor-h": "../resources/mud-h.png",
			"floor-v": "../resources/mud-v.png",
			"floor-hv": "../resources/mud-hv.png",
			"wall": "../resources/wall.png",
			"target-active": "../resources/target-active.png",
			"target-inactive": "../resources/target-inactive.png",
			"koth": {
				"neutral": "../resources/koth-neutral.png",
				"blue": "../resources/koth-blue.png",
				"green": "../resources/koth-green.png",
				"yellow": "../resources/koth-yellow.png",
				"red": "../resources/koth-red.png"
			}
		},
		"animations": {
			"shoot": "../resources/fire.png",
			"hit": "../resources/hit.png",
			"bump": "../resources/bump.png",
			"scan": "../resources/scan.png",
			"explode": "../resources/explode.png",
			"spawn": "../resources/spawn.png",
			"oom": "../resources/oom.png"
		},
		"audio": {
			"shoot": "../resources/audio/fire1.mp3",
			"hit": "../resources/audio/hit1.mp3",
			"bump": "",
			"scan": "../resources/audio/scan1.mp3",
			"explode": "../resources/audio/explode1.mp3",
			"spawn": "../resources/audio/spawn1.mp3",
			"oom": "../resources/audio/oom1.mp3"
		}
	}
};

Theme.selectTheme = function(selectTheme) {
	var keys = [];
	for(var k in theme) keys.push(k);

	// scan for selectTheme
	if (!selectTheme || keys.indexOf(selectTheme) == -1) return 'default';
	return selectTheme;
};

Theme.isAudioEnabled = function() {
	return enableAudio;
};

Theme.getTankImage = function(selectTheme, colour) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['tank'][colour];
};

Theme.getDeadTankImage = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['tank']['dead'];
};

Theme.getFloorImage = function(selectTheme, layout) {
	var selectTheme = Theme.selectTheme(selectTheme);
	switch (layout) {
		case undefined:
			return theme[selectTheme]['objects']['floor'];
			break;
		case 'horizontal':
			return theme[selectTheme]['objects']['floor-h'];
			break;
		case 'vertical':
			return theme[selectTheme]['objects']['floor-v'];
			break;
		case 'horizontal+vertical':
			return theme[selectTheme]['objects']['floor-hv'];
			break;
	}
};

Theme.getWallImage = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['objects']['wall'];
};

Theme.getTargetImage = function(selectTheme, active) {
	var selectTheme = Theme.selectTheme(selectTheme);
	switch (active) {
		case 'active':
			return theme[selectTheme]['objects']['target-active'];
			break;
		case 'inactive':
		return theme[selectTheme]['objects']['target-inactive'];
			break;
	}
};

Theme.getKothImage = function(selectTheme, colour) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['objects']['koth'][colour];
};

Theme.getShootAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['shoot'];
};

Theme.getOomAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['oom'];
};

Theme.getExplodeAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['explode'];
};

Theme.getHitAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['hit'];
};

Theme.getScanAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['scan'];
};

Theme.getBumpAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['bump'];
};

Theme.getSpawnAnimation = function(selectTheme) {
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['animations']['spawn'];
};

Theme.getShootAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['shoot'];
};

Theme.getOomAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['oom'];
};

Theme.getExplodeAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['explode'];
};

Theme.getHitAudio = function(audio) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['hit'];
};

Theme.getBumpAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['bump'];
};

Theme.getScanAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['scan'];
};

Theme.getSpawnAudio = function(selectTheme) {
	if (!Theme.isAudioEnabled()) return "";
	var selectTheme = Theme.selectTheme(selectTheme);
	return theme[selectTheme]['audio']['spawn'];
};
