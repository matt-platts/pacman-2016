/* 
 * File: pacman.js
 * Meta: game logic
 * Note: development very much in progress - rewrite imminent.
*/


// NOTES TO SELF: 
// Look for the text HACK2016 in the code - this means I changed something without fully understanding the implications (it's old code)
// Specifically - checking that possG[wg] exists before trying to read a charAt. I *think* it is because the maze data isn't populated with zeros and the ghost path information isn't in the maze data, so this hack should be removed when the data set is completed.


// pacman.js
// by Matt Platts, 1999-2000. Updated for Netscape 6, June 2001. Tweaks for Google Chrome and Firefox around 2009. Updated 2016, and in progress.. 

/* 
 * SECTION 1 - set up variables, and init function to initialise the game. 
*/

// initial settings. these should be increased at around 10000 points?
var powerPillLifetime=200; // how many iterations the powerpill lasts for - hard is 120
var ghostBlinkLifetime=25; // how long the ghosts blink for within the power pill. Hard is 15.
var fruitLifetime=95; // how many iterations a piece of fruit stays on screen - hard is 80
var messageLifetime=1500; // millisecons for the duration of a message (life lost, get ready etc)
var basicVision = sessionStorage.basicVision; // turns on whether ghosts move towards you in ALL modes or not. 
var scatterTime = 300; // how long ghosts remain in scatter mode before switching to chase mode
var chaseTime = 50;
var mode = "scatter"
var previousMode = "scatter";
var levelOptions;

// localise session storage vars
var lives = parseInt(sessionStorage.lives)
var score = parseInt(sessionStorage.score)
var exlife1 = sessionStorage.exlife1;
var exlife2 = sessionStorage.exlife2;
var speed = sessionStorage.speed;
var gameTime = sessionStorage.gameTime;
var level = sessionStorage.level;

// Define timers
var pacTimer;
var ghostsTimer;

// define vars for game end routine 
var mazecount=0
var mazeNo=0

// scores
var ghostscore=50
var nextfruitscore=score+600

// set up images sources
ghimg0 = new Image
ghimg0.src = 'graphics/ghost_red.gif'
ghimg1 = new Image
ghimg1.src = 'graphics/ghost_pink.gif'
ghimg2 = new Image
ghimg2.src = 'graphics/ghost_blue.gif'
ghimg3 = new Image
ghimg3.src = 'graphics/ghost_orange.gif'
ghimg5 = new Image
ghimg5.src = 'graphics/ghost5.gif'
ghimg6 = new Image
ghimg6.src = 'graphics/ghost6.gif'
eyes = new Image
eyes.src = 'graphics/eyes.gif'
blank = new Image
blank.src = 'graphics/blank.gif'
berry0 = new Image
berry0.src = 'graphics/cherry.gif'
berry1 = new Image
berry1.src = 'graphics/strawberry.gif'

// Initialise global vars. (have so many global vars.. time for OO!)
var won = false // true if won the game
var keycount=0 // number of keys currently depressed
var newdatabit = 0 // ??! 
var onPause = 0 // game paused by the 'p' key or when displaying messages (eg. lost life)
var pillType = 0 // bool - is there a pill in the current cell?
var pilcount = 0 // number of pills eaten
var ppTimer = "0" //counts down from 80 back to 0 when a powerpill is eaten
var powerpilon = false // set to true when powerpill is eaten, back to false when it wears off
var moving = false
var newkey = "R" // key just pressed
var lastkey = "D" // key previously pressed (I have no idea why it is set to D)
var movekey = "D" // active key (as above)
var fruitOn=false
var fruitTimer=0 // decrements when a fruit is on screen
var movespeed=speed; // set to the basic speed to start
var ghostspeed=speed; // set to the basic speed to start 
var resetModeTime=gameTime; // the time the mode was last reset to the default (scatter). It starts as the game starts, so at gameTime;.

// start positions - still needs to be calculated from the maze data in time 
if (!pacStartTop){
	var pacStartTop=265
} else {
	document.getElementById("pacman").style.top=pacStartTop // for now just adjust it on the page
}
var pacStartLeft=305
var ghostStartTop=195
var ghostStartLeft=305
if (sessionStorage && sessionStorage.level==2) {
	pacStartTop=265
	pacStartLeft=305
	ghostStartTop=195
	ghostStartLeft=305
}
var thisfruit=0
var fruitArray = new Array(true,true)

/* Function: init
 * Meta: init() was originally called from the body onLoad, now it is called after the dynamically loaded javascript maze for the first level. 
 *       init() sets up cross-browser pointer variables, defines several arrays for later use, then calls start function to kick off the level itself. 
 *       This is only required for the first level of the game.
*/
function init(){

	ns=(navigator.appName.indexOf('Netscape')>=0)? true:false
	n6=(document.getElementById && !document.all)? true:false
	if (n6) {ns=false; document.all=document.getElementsByTagName}

	if (n6){
		divPacman  =  (ns)? document.pacman:document.getElementById('pacman').style
		divGhost0  =  (ns)? document.ghost0:document.getElementById('ghost0').style
		divGhost1  =  (ns)? document.ghost1:document.getElementById('ghost1').style
		divGhost2  =  (ns)? document.ghost2:document.getElementById('ghost2').style
		divGhost3  =  (ns)? document.ghost3:document.getElementById('ghost3').style
		divFruit   =  (ns)? document.fruit:document.getElementById('fruit').style
		divMessage =  (ns)? document.message:document.getElementById('message').style
		divStart   =  (ns)? document.start:document.getElementById('start').style
		divMessEnd =  (ns)? document.messageEnd:document.getElementById('messageEnd').style
	} else {
		divPacman   =  (ns)? document.pacman:document.all.pacman.style
		divGhost0   =  (ns)? document.ghost0:document.all.ghost0.style
		divGhost1   =  (ns)? document.ghost1:document.all.ghost1.style
		divGhost2   =  (ns)? document.ghost2:document.all.ghost2.style
		divGhost3   =  (ns)? document.ghost3:document.all.ghost3.style
		divFruit    =  (ns)? document.fruit:document.all.fruit.style
		divMessage  =  (ns)? document.message:document.getElementById('message').style
		divStart    =  (ns)? document.message:document.all.start.style
		divMessEnd  =  (ns)? document.messageEnd:document.all.messageEnd.style
	}

	ghost0src = (ns)? divGhost0.document.images[0]:document.images.gst0
	ghost1src = (ns)? divGhost1.document.images[0]:document.images.gst1
	ghost2src = (ns)? divGhost2.document.images[0]:document.images.gst2
	ghost3src = (ns)? divGhost3.document.images[0]:document.images.gst3
	fruitsrc = (ns)? divFruit.document.images[0]:document.images.berry

	scoreform  = (ns)? document.score.document:document.forms[0].elements[0];
	lifeform   = (ns)? document.score.document:document.forms[0].elements[1];
	timeform   = (ns)? document.score.document:document.forms[0].elements[2];
	pilsrc     = (ns)? document:document

	if (ns) {
		document.captureEvents(Event.KEYDOWN|Event.KEYUP);
		document.onkeydown=kdns
		document.onkeyup=ku
	}

	ghostData = new Array (6,7,9,10) // used later to test for if opposite directions are present
	leftG = new Array; topG = new Array; possG = new Array; engGhost = new Array
	preGtop = new Array; preGleft = new Array
	vulnerable = new Array (true, true, true, true)
	onPath = new Array (false, false, false, false)

	if (sessionStorage){
		if (sessionStorage.level>1){
			scoreform.value = sessionStorage.score
			lifeform.value = sessionStorage.lives
		}
	}

	ghostDir = new Array
	pacLeft = parseInt(divPacman.left)
	pacTop = parseInt(divPacman.top)
	for(i=0;i<4;i++){
		leftG[i] = eval ("divGhost" + i +".left")
		leftG[i] = parseInt(leftG[i])
		topG[i] = eval ("divGhost" + i +".top")
		topG[i] = parseInt(topG[i])
		ghostDir[i] = "U"
	}
	start();
}

/* 
 * SECTION 2 - The two main loop functions - ghosts and move
*/

/* 
 * Function: ghosts
 * Meta: Deals with the ghosts movements on a recurring timer as one of the main game loops. 
 *       Collision detection is also a part of this loop and not a part of move.
 * 
*/
function ghosts(){

	gameModes(); // these adjust on a timer

	// The movement functions are run four times in a loop - once for each ghost
	for (wg=0;wg<4;wg++){
		// 1. Load the possible moves from the mazedata array into the possG array. 
		//   All the data for all the ghosts is used later (collision detection) hence the array. 
		possG[wg] = mazedata[topG[wg]][parseInt(leftG[wg])];

		// 2. Check possibile moves. The ghostData array contains info on which moves are possible. 
		//    If more than 2 directions are present, or only 1 (ie backwards, so dead end) - a new direction must be generated...
		totalDirections=0 // counters for each ghost
		for (n=0;n<4;n++){
		ghostData[n]=0
		if (possG[wg] && possG[wg].charAt(n) != "X") { // HACK2016
			ghostData[n] = "8" // the 8 is a random otherwise unused character, just need something for checking in section 4 below
			totalDirections++;
		} else {
			ghostData[n] = n}
		}

		// 3. Call function to get ghost direction where there are 1 or more than two directions
		if (totalDirections>2 || totalDirections==1) generateGhostDir(wg,totalDirections,possG[wg])

		// 4. if there's 2 directions only, need to ascertain if they are 180 or 90 degrees. 
		// The '8' added above is used to ascertain if they are opposite directions (eg Left & Right) or not. 
		// If they're opposite, obviously the previous direction will apply.
		// If they're at right angles (No cases of 2 8's next to each other) a new direction must be generated.
		firstPair = false; secPair = false
		if (totalDirections==2) {
			if (ghostData[0] == ghostData[1]) firstPair = true
			if (ghostData[2] == ghostData[3]) secPair = true
			if (!firstPair && !secPair) { generateGhostDir(wg,totalDirections,possG[wg]);}  // don't have any pairs so it's right angles
		}

		// if basicVision is set, and ghost is not onPath to home, compare ghost positions to your position & if it can see you, adjust direction.
		if (!onPath[wg] && basicVision === true) { checkBasicVision(wg) }

		// For each ghost, if ghostDir (current direction) is in the possG array (the move is possible) then a flag to engage the ghost (engGhost) is set to true. 
		// Otherwise (move not possible) engGhost (engage ghost) is set to false. Thus, the ghost is only engaged if it can make the move. 
		// NB: Ghost is also engaged if onPath is true, as it knows where it's going (onPath means the ghost has been eaten and is on a path to the base.. - this path is coded into the mazedata array)

		//status = (wg + "--" + possG[wg]) //status bar for error checking
		if (!possG[wg]){ possG[wg]="0";} // HACK2016
		if (ghostDir[wg] == possG[wg].charAt(0) || ghostDir[wg] == possG[wg].charAt(1) || ghostDir[wg] == possG[wg].charAt(2) || ghostDir[wg] == possG[wg].charAt(3) || onPath[wg]) {
			engGhost[wg] = true;
		} else {
			engGhost[wg] = false
		}

		// if onPath is true for the particular ghost, and there's a path direction present in the array, change the ghost's direction to follow the path home...
		// 2016 - think this is defunct now as path is calculated as part of getting the ghosts movement.
		/*
		if (onPath[wg] && possG[wg].length=='6') {
			ghostDir[wg] = possG[wg].charAt(5)
			//alert("Ghost" + i + " told to go " + ghostDir[i])
		} else if (onPath[wg]){
			//console.log("ON A PATH");
		
		}
		*/

		//status bar stuff for checking variables..
		//status = possG[0] + ":" + possG[1] + ":" + possG[2] + ":" + possG[3] + "-- " + ghostDir[0] + " " + ghostDir[1] + " " + ghostDir[2] + " " + ghostDir[3] + "**** " + secondGhost[1] + "^^" + engGhost[0] + engGhost[1] + engGhost[2] + engGhost[3]

		// We store ghost positions so can be compared to positions next time round. If same, generate new direction. 
		// This is to over-ride when they stick if they're following you and you move out of the way, as there's nothing else to tell them to generate a new direction.
		// update 2016 - this is NONSENSE! Need to generate a proper direction now I have the speed sorted!
		if (preGtop[wg] == topG[wg] && preGleft[wg] == leftG[wg]) generateGhostDir(wg,totalDirections,possG[wg])
		preGtop[wg] = topG[wg]
		preGleft[wg] = leftG[wg]
		

		//if the ghost is engaged, update position variable, and then position
		if (engGhost[wg] || onPath[wg]) {
			if (ghostDir[wg] == "U") {topG[wg] = (topG[wg]-10); eval ("divGhost" + wg + ".top = topG[wg]")}
			if (ghostDir[wg] == "D") {topG[wg] = (topG[wg]+10); eval ("divGhost" + wg + ".top = topG[wg]")}
			if (ghostDir[wg] == "L") {leftG[wg] = (leftG[wg]-10); eval ("divGhost" + wg + ".left = leftG[wg]")}
			if (ghostDir[wg] == "R") {leftG[wg] = (leftG[wg]+10); eval ("divGhost" + wg + ".left = leftG[wg]")}
		}

		// For the path stuff... if it goes off the maze (er.. this means there is an error somehow int the mazedata array!), then immediately return to home.
		if (onPath[wg]){
			if (topG[wg]>445 || topG[wg] <25 || leftG[wg]<35 || leftG[wg] >575) {
				eval ("divGhost" + wg + ".left = ghostStartLeft")
				eval ("divGhost" + wg + ".top = ghostStartTop")
				leftG[wg] = eval ("parseInt(divGhost" + wg + ".left)")
				topG[wg] = eval ("parseInt(divGhost" + wg + ".top)")
				onPath[wg] = false
				ghostDir[wg] = "U"
				eval ("ghost" + wg + "src.src=ghimg" + wg + ".src")
			}
			// and if it's home, reset it to not vulnerable and back to correct image
			if (leftG[wg] == ghostHomeBase[0] && topG[wg] == ghostHomeBase[1]){
				if (!won){ onPath[wg] = false; }
				vulnerable[wg] = false;
				eval ("ghost" + wg + "src.src=ghimg" + wg + ".src")
				ghostDir[wg] = "U"
			}
		}

		// Collision detection
		// If so, either send the ghost home, or lose a life, depending whether a powerpill is currently active. 
		if (ppTimer > 1){
			closeness_allowed=20;
		} else {
			closeness_allowed=30;
		}

		// detect collision
		if (pacLeft > leftG[wg]-20 && pacLeft < leftG[wg]+20 && pacTop > topG[wg]-20 && pacTop < topG[wg]+20 && 
			(pacLeft == leftG[wg] || pacTop == topG[wg] || vulnerable[wg])) // this ensures not on a corner, as the closeness is not correct - pacman makes a move down and the ghost goes accross and therefore matches with the rest of the equation - which we don't want - it means you can't get away. If the ghost is vulnerable, i've decided to let this through though.. 
			{

			// if no Powerpill and game not won and ghost not on path, you've lost a life
			// or pill is on but ghost is not vulnerable then same
			if ((ppTimer=="0" && !won && !onPath[wg]) || (ppTimer>="1" && !vulnerable[wg] && !onPath[wg])) {
				lives = (lives-1)
				score -= 50
				scoreform.value = score
				lifeform.value -= 1
				resetModeTime = timeform.value;
				
				// reset ghost release time and mode
				mode="scatter";
				ghostReleaseTime = timeform.value;
				ghostDelayRelease=Array(); // used to delay the release of each ghost
				for (i=0;i<4;i++){
					ghostDelayRelease[i] = ghostReleaseTime - i*15;
					//showmode("Set mode to " + mode + " for scatterTime " + scatterTime);
				}
				divMessage.visibility='visible'
				onPause=1;
				setTimeout('divMessage.visibility=\'hidden\'; onPause=0; pacTimer = setTimeout("move()",movespeed); ghostsTimer = setTimeout("ghosts()",ghostspeed)',messageLifetime);
					
				 if (lives==0) {
					 divMessEnd.visibility='visible'
					 onPause=1;
					 divMessage.display="none";
					 locStr = "intropage.html?score=" + score;
					 setTimeout('won=true; sessionStorage.score=score; location=locStr;',messageLifetime);
				} else {
					reset()
				} 
			//if powerpill is on and ghost is vulnerable, turns ghost to eyes, sets first possible direction, and makes path true
			} else if (ppTimer>="1" && vulnerable[wg]) {
				eval ("ghost" + wg + "src.src = eyes.src")
				vulnerable[wg] = false;
				onPath[wg] = true
				score += ghostscore
				ghostscore+=50
				scoreform.value = score
		      } 
		}
	}

	// Decrement the power pill timer, and change source of ghost images if powerpill nearly over.
	if (ppTimer >0) {
		ppTimer=(ppTimer-1);
	}

	if (ppTimer == ghostBlinkLifetime) {
		for(i=0;i<4;i++){
			if (!onPath[i]) {
				if (vulnerable[i]) eval ("ghost" + i + "src.src = ghimg6.src")
			}
		}
	}

	// Return ghost to normal when powerpill wears off.
	if (ppTimer == "0" && powerpilon) {
		powerpilon=false
		mode=previousMode;
		ghostspeed=speed;
		movespeed=speed;
		for(i=0;i<4;i++){
			if (!onPath[i]) {
				eval ("ghost" + i + "src.src = ghimg" + i + ".src")
				onPath[i]=false
				vulnerable[i] = true
				ghostscore=50
			}
		}
	}

	// Check to see if a ghost has gone through the channel to the other side of the screen
	for (i=0;i<4;i++){
		ghostPos = mazedata[topG[i]][parseInt(leftG[i])];
		if (ghostPos && (ghostPos.charAt(2)=="O" || ghostPos.charAt(3)=="O")){
			if (leftG[i] <= 35 && ghostDir[i] =="L") {leftG[i] = 555; }
			if (leftG[i] >= 565 && ghostDir[i] =="R") {leftG[i] = 35; }
		}
	}

	//checkBasicVision()
	// Game timer on the screen.. 
	if (!won){ timeform.value--;}
	if (timeform.value==0){
		lives = (lives-1)
		score -= 50
		scoreform.value = score
		lifeform.value -= 1
		gameTime=sessionStorage.gameTime;
		timeform.value=gameTime
		alert ("OUT OF TIME! One life lost.")
		if (lives==0) {
			locStr = "intropage.html?score=" + score;
			alert ("All lives lost - Game Over!! Your score was " + score + " points"); sessionStorage.score = score; location=locStr; } else {
			reset()
		} 

	}

	// And finally, call the function again if the game isn't paused
	if (!onPause){ ghostsTimer = setTimeout("ghosts()",ghostspeed);}
}

/*
 * Function: move
 * Meta: This is one of the two continually looping functions which make up the two game loops. 
 *       It accesses the newkey, lastkey and movekey variables from the keyLogic function, which it compares to 
 * 	 data of possible moves from the mazedata array where pacman currently resides.
*/
function move(){

	// 1. Look up the possible moves from the current position
	possibilities = mazedata[pacTop][pacLeft];
	u = possibilities.charAt(0)
	d = possibilities.charAt(1)
	l = possibilities.charAt(2)
	r = possibilities.charAt(3)

	// 2. If the latest key press has generated a character in the possible moves array, set 'engage', set the movekey var to this key, and also the lastkey var
	if (newkey==u || newkey==d || newkey ==l || newkey == r) {

		engage=true; movekey = newkey; lastkey = newkey // lastkey set to stop constant repetition of last 2 moves without the user touching anything.. see later on.

	} else {

		// 2.1 If previously pressed key generated a character that exists in the possible moves array then we can use that to continue in that direction
		if (lastkey==u || lastkey==d || lastkey==l || lastkey==r) {
			engage = true
			movekey = lastkey

		// 2.2 The latest and last key presses do not match a possible direction - therefore pacman stops. 'engage' and 'moving' set to false
		} else {
			engage = false
			moving = false
		}
	}

	// 3. Engage is now set if a move can be made. This is either off the new key the previously pressed key, it doesn't matter as we make that move.
	if (engage) {

		if (movekey==newkey) { // 4. This means the latest key press and not the previous one generated this move, so we update the icon to point the right way
			newClass = "pacman_" + newkey;
			document.getElementById("pacman").classList.remove("pacman_U");
			document.getElementById("pacman").classList.remove("pacman_D");
			document.getElementById("pacman").classList.remove("pacman_L");
			document.getElementById("pacman").classList.remove("pacman_R");
			document.getElementById("pacman").classList.add(newClass);
		}

		// 5. Move the sprite on screen to correspond to the direction
		if (movekey==u) {divPacman.top=(pacTop-10); pacTop=pacTop-10}
		if (movekey==d) {divPacman.top=(pacTop+10); pacTop=pacTop+10}
		if (movekey==l) {divPacman.left=(pacLeft-10);pacLeft=pacLeft-10}
		if (movekey==r) {divPacman.left=(pacLeft+10); pacLeft=pacLeft+10}


		//console.log("Top: " + pacTop + " Left: " + pacLeft);
		//console.log(mazedata);
		//console.log(mazedata[pacTop][pacLeft]);

		// 6. The var newLocationData is the data for the cell we've just moved into. We may need to process a pill being eaten..
		newLocationData = mazedata[pacTop][pacLeft];
		if (newLocationData.length>=5){// position 4 is a pill, may or may not be there 
			pillType = newLocationData.charAt(4);
		} else {
			pillType = 0;
		}

		if (pillType == "1" || pillType == "2"){
			newLocationData = newLocationData.substring(0,4); 
			mazedata[pacTop][pacLeft] = newLocationData; 
			if (ns) pilsrc = eval("document.p" + pacLeft + pacTop + ".document")
			eval("pilsrc.images.pil_" + pacLeft + pacTop + ".src = blank.src")

			if (pillType==2){
				ppTimer = powerPillLifetime 
				ghostscore=50
				movespeed = speed-10;
				powerpilon = true
				for(i=0;i<4;i++){
					if (!onPath[i]){
						eval ("ghost" + i + "src.src=ghimg5.src")
						vulnerable[i]=true
					}
				}
			}

			pilcount++
			score += 10;
			scoreform.value = score
			if (pilcount>=pillNumber) {
				won = true
				onPath[0]=true; onPath[1]=true; onPath[2]=true;onPath[3]=true;
				document.getElementById("pacman").style.display="none";
				levelEnd();

			}
		}

		// Give extra lives at 5000 and 1000 points. As points may increment considerably on a single cell (although rare) 1000 points leeway for checking is left. 
		if (score>=5000 && score <6000 && exlife1) {
			exlife1=0; sessionStorage.exlife1 = 0;
			lives++; sessionStorage.lives = lives; scoreform.value = lives;
		}
		if (score>=10000 && score <10500 && exlife2) {
			exlife2=0; sessionStorag.exlife2=0;
			lives++; sessionStorage.lives++; scoreform.value = lives;
		} 

		// show a piece of fruit at certain times - based on incrementing score with a length in a decrementing var called fruitTimer
		if (score >= nextfruitscore && score <=nextfruitscore+300 && fruitArray[thisfruit]) {showFruit()}
		if (fruitTimer>0) fruitTimer--
		if (fruitTimer==1) {
			divFruit.visibility='hidden'; fruitOn=false
		}
		//status= parseInt(divFruit.left) + "-" + pacLeft + "--" + parseInt(divFruit.top) + "-" + pacTop

		if (pacLeft==parseInt(divFruit.left) && pacTop == parseInt(divFruit.top) && fruitOn) {
			score=score+250; scoreform.value=score
			fruitOn=false
			divFruit.visibility='hidden'
		}

		// For the tunnels off the side of the mazes, may need to update location of pacman 
		// NB: The tunnel is denoted in the data by a capital O in the movement bit of the data.
		if (newLocationData.charAt(2)=="O" || newLocationData.charAt(3)=="O"){
			if (pacLeft==35){ pacLeft=555; divPacman.left=pacLeft; }
			if (pacLeft==575){ pacLeft=55; divPacman.left=pacLeft; }
		}

		moving = true
		if (!won && !onPause){
			pacTimer = setTimeout("move()",movespeed)
		}
	}
}

/*
 * SECTION 3
 * Logic to deal with which direction ghosts move in
*/

/*
 * Function: showFruit
 * Meta: displays a piece of fruit to the screen, sets fruitOn flag and sets up the criterea for the next one appearing
*/
function showFruit() {
	nextfruitscore+=600
	thisfruit++
	fruitArray[thisfruit]=true
	whichFruit = Math.round(Math.random() *1)
	fruitTimer=fruitLifetime
	if (!fruitOn) eval ("fruitsrc.src=berry" + whichFruit + ".src")
	fruitOn=true
	divFruit.visibility='visible'
}

/* 
 * Function gameModes
 * Meta: This is run at the beginning of the ghosts function to both get, and set, the game mode on a timer.
*/
function gameModes(){

		if (powerpilon){
			if (previousMode != "random") { previousMode=mode;}
			mode="random";
		} else {

			currentTime = timeform.value;
			if (currentTime < parseInt(resetModeTime) - parseInt(scatterTime)){
				showmode("MODE SWITCH from " + mode + " AT !" + currentTime);
			
				if (mode=="scatter"){
					resetModeTime = currentTime - chaseTime;
					mode="chase";
					showmode("Set mode to chase");
				} else if (mode=="chase"){
					resetModeTime = currentTime - scatterTime;
					scatterTime = scatterTime - 10; 
					mode="scatter";
					showmode("Set mode to scatter");
				} else {
					if (previousMode != "random"){
						mode=previousMode;
					} else {
						mode="scatter";
						previousMode="scatter";
					}
				}
			}
		}
		if (mode=="random" && !powerpilon){
			mode=previousMode;
		}

		showmode("MODE: " + mode + " next change at " , parseInt(resetModeTime) -parseInt(scatterTime));

}

/*
 * Function: generateGhostDir
 * Meta: Generates a new direction for a particular ghost 
*/
function generateGhostDir(who,howMany,possibilities){

		currentTime = timeform.value;
		if (onPath[who]){
			ghostMode="homing";
		} else if (ghostDelayRelease[who] < currentTime){
			ghostMode="sit";
		} else if (powerpilon && !vulnerable[who]){
			ghostMode="scatter";
		} else {
			ghostMode=mode;
		}
		
		//console.log(mode,resetModeTime);

		dice=Math.round(Math.random() * 6);

		if (ghostMode=="scatter" && dice < 7){

			if (!onPath[who]){
				     if (who==0){ headLeft = 535; headUp=435;} // red
				else if (who==1){ headLeft = 35; headUp=35;} // blue
				else if (who==2){ headLeft = 535; headUp=35;} // pink
				else if (who==3){ headLeft = 35; headUp=435;} // orange
				ghostDir[who] = headFor(who,Array(headLeft,headUp));
			}

		} else if (ghostMode=="chase" && dice < 7){

			if (!onPath[who]){
				headLeft = parseInt(divPacman.left);
				headUp= parseInt(divPacman.top);
				ghostDir[who] = headFor(who,Array(headLeft,headUp));
			}

		} else if (ghostMode=="homing"){

			ghostDir[who] = headFor(who,ghostHomeBase);

		} else if (ghostMode=="random") { // random

				possibilities=possibilities.replace(/X/g,"");
				if (mazedata[topG[who]][leftG[who]] == "3" && !onPath(who)){// ghosts can only re-enter the home base when on a path to regenerate 
					possibilities=possibilities.replace(/5/g,"");
				}
				if (howMany>2){ // NB: having howmany>2 gives more chances for the ghosts to backtrack on themsleves, making them easier to catch.
					possibilities=excludeOppositeDirection(who,possibilities);
					howMany--;
				}
				if (!onPath[who]) {
					direction = Math.floor(Math.random() *(howMany));
					ghostDir[who] = possibilities.charAt(direction);
				} else {
					ghostDir[who] = headFor(who,ghostHomeBase);
				}

		} else if (ghostMode=="sit"){
			direction=Math.round(Math.random() * 1);
			if (direction==0){ ghostDir[who]=possibilities.charAt(2); } else { ghostDir[who]=possibilities.charAt(3);}
			ghostDir[who] = headFor(who,ghostHomeBase);
		}
}

/* Function excludeOppositeDirection
 * Meta: Removes the opposite direction from the list of possible moves - no point in going back where we've just come fron - keeps them moving around 
*/
function excludeOppositeDirection(who,possibilities){
	if (ghostDir[who]=="R"){
		possibilities=possibilities.replace(/L/,"");
	}
	if (ghostDir[who]=="L"){
		possibilities=possibilities.replace(/R/,"");
	}
	if (ghostDir[who]=="D"){
		possibilities=possibilities.replace(/U/,"");
	}
	if (ghostDir[who]=="U"){
		possibilities=possibilities.replace(/D/,"");
	}
	return possibilities;
}

/* 
 * Function: headFor
 * Param who (string) - index of which ghost we are sending somewhere
 * Param where (array) - 2 item aray of L and R co-ordinates of the cell we are sending the ghost toi
 * Return dir (string) - the direction that can be direcly set for that ghost
*/
function headFor(who,where){
	currentCell = mazedata[parseInt([topG[who]])][parseInt(leftG[who])]
	if (!currentCell){
		alert ("NO CURRENT CELL!");
	}
	//console.log(currentCell);
	var dir=null;

	if (leftG[who] > where[0] && currentCell.charAt(2)=="L" && ghostDir[who] != "R" && ghostDir[who] != null){
		dir = "L";
		//console.log("Going" + dir);	
	} else if (leftG[who] <= where[0] && currentCell.charAt(3)=="R" && ghostDir[who] != "L" && ghostDir[who] != null){
		dir= "R";
		//console.log("Going" + dir);	
	}

	if (topG[who] > where[1] && currentCell.charAt(0)=="U" && ghostDir[who] != "D" && ghostDir[who] != null){
		dir="U";
		//console.log("Going" + dir);	
	} else if (topG[who] <= where[1] && currentCell.charAt(1)=="D" && ghostDir[who] != "U" && ghostDir[who] != null){
		dir="D";
		//console.log("Going" + dir);	
	}
	if (currentCell.charAt(4)=="3"){ dir="U";} // for when ghosts are in the pound
	

	//console.log(ghostDir[who],topG[who],leftG[who],ghostHomeBase[0],ghostHomeBase[1],currentCell.charAt[0],currentCell.charAt[1],currentCell.charAt[2],currentCell.charAt[3],dir);

	// not got a direction? Means we can't head there directly, so lets make a decision 
	// if there are only two possibilities, try and force a 90 degree angle turn, otherwise just go through some defaults.
	// logic is: if its going R or L, force in this order: U,D,L,R 
	// 	     if its going U or D, force in this order: L,R,U,D
	if (!dir) { 
		
		possibilities=currentCell.substr(0,4).replace(/X/g,""); // remove the X's so we can get total number of directions available

		if (possibilities.length==2){
			if (ghostDir[who]=="R" || ghostDir[who]=="L"){
				if (currentCell.charAt(0)=="U"){ 
					dir= "U";
				 } else if (currentCell.charAt(1)=="D"){
					dir= "D";
				} else if (currentCell.charAt(2)=="L"){
					dir= "L";
				} else {
					dir= "R";
					alert("This wont even happen");
				}
				//console.log("FORCE DIRECTION LEFT OR RIGHT",currentCell,who,dir,"in mode:" + mode);
			} else  if (ghostDir[who]=="D" || ghostDir[who]=="U"){
				if (currentCell.charAt(2)=="L"){ 
					dir= "L";
				 } else if (currentCell.charAt(3)=="R"){
					dir= "R";
				 } else if (currentCell.charAt(0)=="U"){
					dir= "U";
				} else {
					dir="D";
					alert("This will never happen");
				}
				//console.log("FORCE DIRECTION UP OR DOWN",currentCell,who,dir,"in mode:" + mode);
			} 
		} else if (possibilities.length==1){

				dir = possibilities;

		} else if (possibilities.length==3 || possibilities.legnth==4){
			// here for 1,3 or 4 possibilities
			// for now, forcing in the order up, right, down, left

			// just keep going? works well for 3 and 4 so far..
			dir = ghostDir[who];
		} else {
			alert("WHy!!!!");
		}
	}

	/*if (!dir){
		istr = "Nowhere to go for " + who + " heading " + ghostDir[who] + " in mode of " + mode;
		istr = istr + " to " + where[0] + "," + where[1];
		istr = istr + " from " 
		istr = istr + leftG[who] + "," + topG[who] + " in mode " + mode; 
		console.log(istr);
		showmode(istr);
	}*/
	return dir;
}

/*
 * SECTION 4
 * Key functions to deal with all the key press logic
*/

/* Function: kd
 * Meta: keydown = invoked if key pressed. 
 *       if the game is paused and P has been pressed again to unpause, the unpause happens here by kicking off the game timers.
 *       for any other key logic is more complex and it is passed to keyLogic
*/
function kd(e){

	e.preventDefault();

	if (onPause){
		if (pacTimer){ clearTimeout(pacTimer);}
		if (ghostsTimer){ clearTimeout(ghostsTimer);}
		if (gameTimer){ clearTimeout(gameTimer);}

		if (document.all && !document.getElementById){key = window.event.keyCode}
		if (document.getElementById){ key = e.keyCode}
		if (key == "80" || key == "112"){
			onPause=0;
			move(); ghosts();
		}

	} else {
		if (keycount>=2) {keycount=0; movekey="Q"; if (!moving) move()}
		if (document.all && !document.getElementById){key = window.event.keyCode}
		if (document.getElementById){ key = e.keyCode}
		keyLogic(key);
	}
}

// netscape 4 version of kd.
function kdns(evt){
	if (keycount>=2) {keycount=0; movekey="Q"; if (!moving) move()}
	key = evt.which
	//status = key
	keyLogic(key);
}
	
/*
 * Function: keyLogic
 * Meta: First works out which key it is, and translates it to a direction (or performs the pause or reset action). 
 *       Four flags are present here - key, newkey, lastkey & movekey.
 *		key - this contains the key that has just been pressed resulting in this funciton being called, which 
 * 		is immediately translated to upper case ASCII via it's ord value
 * 		movekey - this is the key which generated the current movement. The movement has the same upper case ASCII
 *  			  char value as the key pressed so it is easily compared.
 * 		newkey - If the key which has been pressed is a movement key but NOT the same direction as pacman is 
 * 			 currently heading, newkey is set to the incoming key, and keycount is incremented. This new key
 * 			 *will be* the next direction that pacman takes assuming the move is possible - it is stored for 
 * 			 if that occasion arises. 
 * 			 No action is taken if it is the same key as the current movement - ther eis no need.
 * 		lastkey - this is the last key to be used which changed the direction of pacman, and consequently indicates 
 *			  the direction in which he is currently traelling (which possibly makes this var redundant!
 *
 * 	 All of this data is picked up by the continually looping move function which contains inline explanations of what
 *	 is going on.
 *
 * 	 Some kind of explanation at deciphering my 17 year old logic follows:
 *       If the key that is pressed (key) is not the same as the previously pressed key (newkey - it *was* last time round!), 
 *       then that previously pressed key is stored in lastkey. This signifies that a new movement is waiting to happen when it can.
 * 	 Movekey is the current movement, and if it's not the same as the key just pressed (key) the value is stored in newkey, 
 * 	 and the move function is called if a flag 'moving' is false. move() itself is on a timer, but we don't wna to wait. 
 * 	 The keycount variable is also incremented. 
 * 	 Hmm no that didn't really help either did it..
*/
function keyLogic(key){

	// movement kreys (aznm or cursor keys)
	if (key=="65" || key=="97" || key == "38") {key="U"}
	if (key=="90" || key=="122" || key == "40") {key="D"}
	if (key=="78" || key=="110" || key == "37") {key="L"}
	if (key=="77" || key=="109" || key == "39") {key="R"}

	// game reset key (r)
	if (key=="82" || key=="114"){ top.location.reload();} // r = reset
	
	// game pause key (p)
	if (key=="80" || key=="112"){
			onPause=1; 
			if (pacTimer){ clearTimeout(pacTimer);}
			if (ghostsTimer){ clearTimeout(ghostsTimer);}
			if (gameTimer){ clearTimeout(gameTimer);}
		
	} else {
		if (movekey != key) {newkey = key; if (!moving) move(); keycount++}
	}

}

/* 
 * Function : ku
 * Meta: decreases keycount by one as a key goes up
*/
function ku(e){
	keycount--;
}



/*
 * Function: getBasicVisionDir
 * Meta: Get a direction based on the basic vision feature, used in the checkBasicVision function
 * NB: The lack of checking whether or not the direction can be made is actually what slows down the ghosts when a pill is on and they are in your line of sight
 * Although not programatically brilliant, it worked for the game in an 'off label' kind of way, so it got left. 
*/
function getBasicVisionDir(who,not){
	ghostDir[wg] = Math.floor(Math.random() *3);
	if (ghostDir[wg] == "0") {ghostDir[wg] = "U"}
	if (ghostDir[wg] == "1") {ghostDir[wg] = "D"}
	if (ghostDir[wg] == "2") {ghostDir[wg] = "L"}
	if (ghostDir[wg] == "3") {ghostDir[wg] = "R"}
	if (ghostDir[wg] == not) {getBasicVisionDir(wg,not)}
}

/*
 * SECTION 5
 * Game resets
*/

/*
 * Function: reset
 * Meta: Resets all positions, image sources and directions if a life is lost
*/
function reset(){

	if (pacTimer){ clearTimeout(pacTimer);}
	if (ghostsTimer){ clearTimeout(ghostsTimer);}
	if (gameTimer){ clearTimeout(gameTimer);}

	divPacman.top=pacStartTop
	divPacman.left=pacStartLeft

	document.getElementById("pacman").style.display="block";
	document.getElementById("pacman").classList.remove("pacman_U");
	document.getElementById("pacman").classList.remove("pacman_D");
	document.getElementById("pacman").classList.remove("pacman_L");
	document.getElementById("pacman").classList.add("pacman_R");

	won=false;
	pacLeft = parseInt(divPacman.left)
	pacTop = parseInt(divPacman.top)

	for (i=0;i<4;i++){
		eval ("divGhost" + i + ".top=ghostStartTop")
		eval ("divGhost" + i + ".left=ghostStartLeft")
		leftG[i] = eval ("parseInt(divGhost" + i + ".left)")
		topG[i] = eval ("parseInt(divGhost" + i + ".top)")
		vulnerable[i] = true
		eval ("ghost" + i + "src.src=ghimg" + i + ".src")
		ghostDir[i]="U"
	}
	newkey = "R"
	ppTimer="0"
	ghostscore=50
	mode="scatter";
}

/* 
 * Function : checkBasicVision (previously called 'intelligence') 
 * Meta: Gives the ghosts a bit of thinking power. If there's a clear line between them and you, 
 *      this function will change their direction to move towards you, unless a powerpill is 
 *      active on them, in which case they go in any direction that is not towards you.  
*/
function checkBasicVision(g){
	//status=(wg + "-" + wg + "--" + pacTop)
	if (leftG[wg] == pacLeft) {// if left is equal
		if (topG[wg] < pacTop) {// ghost < pac
			changedir=true
			for (v=topG[wg];v<pacTop;v=(v+10)){
				newdatabit = mazedata[v][pacLeft];
				//console.log(v,pacLeft);
				//console.log(mazedata[v][pacLeft]);
				//console.log(newdatabit);
				//console.log(mazedata);
				if (!newdatabit || newdatabit.charAt(1) != "D") changedir=false
			}//for j
			if (changedir && ppTimer =="0"){ ghostDir[wg] = "D"} else if (changedir && ppTimer >="1" && vulnerable[wg]) {getBasicVisionDir(wg,"D")} else if (changedir && ppTimer >="1" && !vulnerable[wg]) { ghostDir[wg] = "D"}
		} else {
			if (topG[wg] > pacTop) {// ghost > pac
				changedir=true
				for (v=pacTop;v<topG[wg];v=(v+10)){
				newdatabit = mazedata[v][pacLeft]
				if (newdatabit && newdatabit.charAt(0) != "U") changedir=false
				}//for j
				if (changedir && ppTimer == "0"){ ghostDir[wg] = "U"} else if (changedir && ppTimer >="1" && vulnerable[wg]) {getBasicVisionDir(wg,"U")} else if (changedir && ppTimer >="1" && !vulnerable[wg]) { ghostDir[wg] = "U"}
			}//if topG gtr than pacTop
		}//if topG less than pacTop
	}// if eq left

	if (topG[wg] == pacTop) {// if vertical is equal
		if (leftG[wg] < pacLeft) {// if ghost < pac
			changedir=true
			for (v=leftG[wg];v<pacLeft;v=(v+10)){
				newdatabit = mazedata[pacTop][v]
				if (newdatabit && newdatabit.charAt(3) != "R") changedir=false
			}//for j
			if (changedir && ppTimer == "0"){ ghostDir[wg] = "R" } else if (changedir && ppTimer >="1" && vulnerable[wg]) {getBasicVisionDir(wg,"R")} else if (changedir && ppTimer >="1" && !vulnerable[wg]) { ghostDir[wg] = "R"; }
		} else {
			if (leftG[wg] > pacLeft) {// if ghost > pac
			changedir=true
			for (v=pacLeft;v<leftG[wg];v=(v+10)){
				newdatabit = mazedata[pacTop][v];
				if (newdatabit && newdatabit.charAt(2) != "L") changedir=false
			}//for j
			if (changedir && ppTimer == "0"){ ghostDir[wg] = "L" } else if (changedir && ppTimer >="1" && vulnerable[wg]) {getBasicVisionDir(wg,"L")} else if (changedir && ppTimer >="1" && !vulnerable[wg]) { ghostDir[wg] = "L" }
			}

		}// if eq top
	}// for i

	//status bar for de-buging
	//status = pacLeft + "-" + pacTop + ":" + pillType + "~~~" + pilcount + "^^^^" + topG[0] + "-" + topG[1] + "-" + topG[2] + "-" + topG[3] + ":::" + newdatabit.length + "****" + keycount
}

/*
 * Function: levelEnd
 * Meta: Flash maze at end of level, and call the loadLevel function to load up the next level.
*/
function levelEnd(){

	pilcount=0;
	resetModeTime=gameTime;
	sessionStorage.score=score
	sessionStorage.lives = lives
	sessionStorage.level++
	if (sessionStorage.level==12){
		sessionStorage.level=1
		if (sessionStorage.speed>=5){sessionStorage.speed=sessionStorage.speed-5;}
	}

	// flash maze
	if (mazeNo==2) mazeNo=0
	mazeCells = document.getElementsByClassName("wallCell");
	wallCells = document.getElementsByClassName("mazeCell");
	if (mazeNo==0){
		for(var i = 0; i < mazeCells.length; i++) {
		    mazeCells[i].style.borderColor = 'white';
		}
		for (var i=0; i < wallCells.length; i++){
			    wallCells[i].style.borderColor = 'white';

		}
		document.getElementById("mazeinner").style.borderColor="white";
	} else {
		for(var i = 0; i < mazeCells.length; i++) {
		    mazeCells[i].style.borderColor = 'blue';
		}
		for (var i=0; i < wallCells.length; i++){
		    wallCells[i].style.borderColor = 'blue';
		}
		document.getElementById("mazeinner").style.borderColor="blue";
	}
	mazeNo++
	mazecount++
	if (mazecount<12) {
		mazeFlashTimer=setTimeout ("levelEnd()",300)
	} else {
		mazecount=0;
		loadLevel(sessionStorage.level);
	}
}

/* 
 * Function: dynLoader
 * Meta: for dynamically loading another javascript and following up with a callback
*/
function dynLoader(url, callback){
    // Adding the script tag to the head
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

/* 
 * Lambda function: startNewLevel
 * Called as: Callback
 * Meta: Renders the new maze, resets the timer, resets the sprite positions and calls start (to show the next level message and kick off the timers) 
*/
var startNewLevel = function (){
	mazedata = renderGrid();
	if (levelOptions != undefined){
		if (levelOptions.pacStartTop){
			pacStartTop=levelOptions.pacStartTop;
		}
	}
	onPause=1;
	timeform.value=gameTime
	reset();
	start();
}

/* Lambda function: renderNewData
 * Called as: Callback
 * Meta: Loads maze.js after the mazedata file has been loaded, and issues a callback to startNewLevel 
*/
var renderNewData = function() {
	dynLoader("js/maze.js",startNewLevel);
}

/*
 * Function: loadLevel
 * Param: level (int) - the number of the level being loaded
 * Meta: Loads the mazedata file from the server, and calls renderNewData as a callback
*/
function loadLevel(level){
	resetModeTime=2000;
	moving = false;
	dataFile = "js/data/mazedata" + level + ".js";
	dynLoader(dataFile,renderNewData);
}

/*
 * Function: start
 * Meta: At the start of each level, or after losing a life, display the message and kick off the game timers
*/
function start(){
	mode="scatter";
	ghostReleaseTime = timeform.value;
	ghostDelayRelease=Array(); // used to delay the release of each ghost
	for (i=0;i<4;i++){
		ghostDelayRelease[i] = ghostReleaseTime - i*47;
		//console.log("START GHOST DELAY RELEASE",ghostDelayRelease[i]);
	}
	onPause=0;
	document.getElementById("levelIndicator").innerHTML = "Level " + sessionStorage.level;
	divStart.visibility="visible";
	gameTimer = setTimeout('divStart.visibility=\'hidden\'; move(); ghosts();',messageLifetime) 
}

/* Temnporary function for debugging and adjusting mode timers  
 * -  lots of console logs seems to slow things down so I can turn it on and off here
*/
function showmode(input){
	return;
	console.log(input);
}

/* Below is simply thiknking about proper OO version and not currently used */

// pacman object constructor
var class_pacman = function(startLeft,startTop){
	this.left=startLeft;
	this.top=startTop;
	this.direction = "R";
	this.lives = sessionStorage.lives;
	this.speed = sessionStorage.speed;

	function move(){}
	function eat(){}
	function powerUp(){}
	function powerDown(){}
	
}

// ghost constructor
var class_ghost = function(name){
	this.name = name;
	// src - the source image can be named after the name
	this.left=305;
	this.top = 195;
	this.alive=1; // gets rid of the onPath global
	this.mode="scatter"; // mode (chase, scatter, frightened, sit, homing)
	this.leftBase=0;
	this.direction = "U";
	this.speed = sessionStorage.speed;
	console.log(this.name);

	function move(){}

	// modes
	function chase(){}
	function scatter(){}
	function sit(){}
	function homing(){}
	function frightened(){}

	function eaten(){}
	
}

var class_maze = function(mazedata){

	function populate(){}
	function removePill(){}
}

var class_level = function(){
	
	function load(){} // load a new level
	function start(){} // start the level off
	function reset(){} // reset all sprites
}

// make four ghosts to start
function makeGhosts(){
	var ghosts_names = new Array("Blinky","Pinky","Inky","Clyde");
	for (i=0;i<ghosts_names.length;i++){
		all_ghosts[i] = new class_ghost(ghosts_names[i]);	
	}
	return all_ghosts;
}

function oo_start(){
	var pacman = new class_pacman(pacStartLeft,pacStartTop);
	var all_ghosts = make_ghosts();
	var total_ghosts = ghosts_names.length;
	var level = new level(level);
	
}

// BELOW IS FIRST THOUGHTS ON USING BINARY DATA FOR THE MAZE DATA AND LOOKUPS 

/*
 * Function binary_lookup
 * Neta; just experimenting
*/
function binary_lookup(direction,data) {

	// assume our movements UDLR are 8,4,2,1 
	// would give us the foolowing
	var moves = Array ();
	moves[0] = 0;
	moves[1] = "R"; // Right only
	moves[2] = "L"; // Left only
	moves[3] = "LR"; // Left and right 
	moves[4] = "D"; // Left only
	moves[5] = "DR"  // Down and right
	moves[6] = "DL"; // Down and left 
	moves[7] = "DLR"; // Down, left, right 
	moves[8] = "U"; // Up only 
	moves[9] = "UR"; // Up and right 
	moves[10] = "UL"; // Up and left
	moves[11] = "ULR"; // Up, left and right
	moves[12] = "UD" ; // Up and down
	moves[13] = "UDR"; // UP down right
	moves[14] = "UDL"; // UP down loeft
	moves[15] = "UDLR"; // All directions

	// by storing the possible positions instead of as UDLR but as a key of the array, can & the current direction to the number to work out if the move is possible

	// example input 1,12 (wher 1 is Right and 12 is the value stored in the data
	// 12 & 1 = 0 - move not possible
	// example input 1,13
	// 13 & 1 = 1 - move possible
	// should mean less bytes to store and quicker lookup

	// convert dec to bin: (15 >>> 0).toString(2); // gives 1111
	// convert bin to dec: parseInt(1111,2); // gives 15

	// to get random direction for all possible directions
	// 1 << Math.floor(Math.random() * 4) // returns 1,2,4 or 8

	// get random direction for pre-existing set x
	// 1 << Math.floor(Math.random() * moves[x].length) // returns 1,2,4 or 8 (which are R,L,D U)

	// to remove the reverse direction from the existing set (we don't want to go backwards)
	// reverse = current == 1 ? 2 : current==2 ? 1 : current==4 ? 8 : 4;
	// possibles = x & ~reverse 

	// thus to generate a new direction but not the way we have come would be:
	// 1 << Math.floor(Math.random() * (x ^ current).toString().length) 

	x = 13; // "UDR"
	current = 8; // right
	console.log("Current:",current,moves[current]);

	reverse = current == 1 ? 2 : current==2 ? 1 : current==4 ? 8 : 4;
	console.log("Reverse direction is:",reverse,moves[reverse]);
	console.log("X:",x,moves[x]);

	removed = x & ~reverse; // we are bitwise anding the nibble with a bitwise not on the reverse direction - moves[removed] gives the new data, removed the index.
	console.log("Possible directions with the reverse removed:", removed, (removed >>> 0).toString(2), moves[removed]);

	// 3 ways of getting the length
	console.log("no_of_bits:",qtyBits((removed>>>0).toString(2)));
	qty_bits_lookup=Array(0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4);
	console.log("lookup len: ", qty_bits_lookup[removed]);
	len = moves[removed].toString().length;
	console.log("len:",len);

	random = Math.floor(Math.random() * len);
	result = 1 << random; 
	//result = 1 << Math.floor(Math.random() * (x & ~ reverse).toString().length) 
	console.log("RESULT:", result, moves[removed] & result, moves[removed].charAt(result-1), " FROM RAND " + random);

}

/* 
 * Function: qtyBits
 * Meta: returns the numbers of set bits in a byte - ie number of directions
*/
function qtyBits(bin){
	count = 0;
	for(i = 0; i < bin.length; i++) { // would use map but creating arrays on the fly is LONG in javascript
		count += (bin >> i) & 0x01;
	}
	    return count;
}
