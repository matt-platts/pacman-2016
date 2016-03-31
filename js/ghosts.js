var ghosts_names = new Array("Blinky","Pinky","Inky","Clyde");
var ghosts = new Array();
var total_ghosts;

// pacman object constructor
var make_pacman = function(){
	this.left=305;
	this.top=265;
	this.direction = "R";
	this.lives = sessionStorage.lives;
	this.speed = sessionStorage.speed;
}

// ghost constructor
var ghost = function(name){
	this.name = name;
	// src - the source image can be named after the name
	this.left=305;
	this.top = 195;
	this.alive=1; // gets rid of the onPath global
	this.mode="scatter"; // mode (chase, scatter, frightened)
	this.leftBase=0;
	this.direction = "U";
	this.speed = sessionStorage.speed;
	console.log(this.name);
}

// make four ghosts to start
function makeGhosts(){
	for (i=0;i<ghosts_names.length;i++){
		ghosts[i] = new ghost(ghosts_names[i]);	
	}
	total_ghosts = ghosts_names.length;
}

var pacman = new make_pacman();
make ghosts();
