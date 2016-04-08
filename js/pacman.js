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
var total_ghosts=4;

// localise session storage vars
var lives = parseInt(sessionStorage.lives)
var score = parseInt(sessionStorage.score)
var exlife1 = sessionStorage.exlife1;
var exlife2 = sessionStorage.exlife2;
var speed = sessionStorage.speed;
var gameTime = sessionStorage.gameTime;
var level = sessionStorage.level;
var fx = sessionStorage.fx

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
berry2 = new Image
berry2.src = 'graphics/mushroom.png'

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
var newkey = 1 // key just pressed
var lastkey = 4 // key previously pressed (I have no idea why it is set to D)
var movekey = 4 // active key (as above)
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
		ghostDir[i] = 8;
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
	for (wg=0;wg<total_ghosts;wg++){

		// 1. Load the possible moves from the mazedata array into the possG array. 
		//   All the data for all the ghosts is used later (collision detection) hence the array. 
		possG[wg] = bindata[topG[wg]][parseInt(leftG[wg])];

		// 2. Check possibile moves. The ghostData array contains info on which moves are possible. 
		//    If more than 2 directions are present, or only 1 (ie backwards, so dead end) - a new direction must be generated...
		totalDirections=qtyBits(possG[wg]);
		if (totalDirections>2 || totalDirections==1) generateGhostDir(wg,totalDirections,possG[wg])

		// 3. if there's 2 directions only, need to ascertain if they are 180 or 90 degrees. 
		if (totalDirections==2) {
			if (possG[wg] != 12 && possG[wg] != 3){ // 12 is Up and Down, 3 is Left and Right - no need to recalc
				 generateGhostDir(wg,totalDirections,possG[wg]);  // don't have any pairs so it's right angles
			}
		}

		// 4. if basicVision is set, and ghost is not onPath to home, compare ghost positions to your position & if it can see you, adjust direction.
		if (!onPath[wg] && basicVision === true) { checkBasicVision(wg) }

		// For each ghost, if ghostDir (current direction) is in the possG array (the move is possible) then a flag to engage the ghost (engGhost) is set to true. 
		// Otherwise (move not possible) engGhost (engage ghost) is set to false. Thus, the ghost is only engaged if it can make the move. 
		// NB: Ghost is also engaged if onPath is true, as it knows where it's going (onPath means the ghost has been eaten and is on a path to the base.. - this path is coded into the mazedata array)

		engGhost[wg] = true;

		// update position variable, and then position
		if (ghostDir[wg] == 8) {topG[wg] = (topG[wg]-10); eval ("divGhost" + wg + ".top = topG[wg]")}
		if (ghostDir[wg] == 4) {topG[wg] = (topG[wg]+10); eval ("divGhost" + wg + ".top = topG[wg]")}
		if (ghostDir[wg] == 2) {leftG[wg] = (leftG[wg]-10); eval ("divGhost" + wg + ".left = leftG[wg]")}
		if (ghostDir[wg] == 1) {leftG[wg] = (leftG[wg]+10); eval ("divGhost" + wg + ".left = leftG[wg]")}

		// For the path stuff... if it goes off the maze (er.. this means there is an error somehow int the mazedata array!), then immediately return to home.
		if (onPath[wg]){
			if (topG[wg]>445 || topG[wg] <25 || leftG[wg]<35 || leftG[wg] >575) {
				eval ("divGhost" + wg + ".left = ghostStartLeft")
				eval ("divGhost" + wg + ".top = ghostStartTop")
				leftG[wg] = eval ("parseInt(divGhost" + wg + ".left)")
				topG[wg] = eval ("parseInt(divGhost" + wg + ".top)")
				onPath[wg] = false
				ghostDir[wg] = 8;
				eval ("ghost" + wg + "src.src=ghimg" + wg + ".src")
			}
			// and if it's home, reset it to not vulnerable and back to correct image
			if (leftG[wg] == ghostHomeBase[0] && topG[wg] == ghostHomeBase[1]){
				if (!won){ onPath[wg] = false; }
				vulnerable[wg] = false;
				eval ("ghost" + wg + "src.src=ghimg" + wg + ".src")
				ghostDir[wg] = 8;
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
				for (i=0;i<total_ghosts;i++){
					ghostDelayRelease[i] = ghostReleaseTime - i*15;
					if (fx){
						document.getElementById("ghost" + i).classList.add("spin");
					}
					//showmode("Set mode to " + mode + " for scatterTime " + scatterTime);
				}
				divMessage.visibility='visible'
				if (fx){
					document.getElementById("pacman").classList.add("spin");
				}
				onPause=1;
				setTimeout('divMessage.visibility=\'hidden\'; onPause=0;   document.getElementById("pacman").classList.remove("spin"); for (i=0;i<total_ghosts;i++){ document.getElementById("ghost" + i).classList.remove("spin"); } pacTimer = setTimeout("move()",movespeed); ghostsTimer = setTimeout("ghosts()",ghostspeed)',messageLifetime);
				
					
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
		for(i=0;i<total_ghosts;i++){
			if (!onPath[i]) {
				if (vulnerable[i]) eval ("ghost" + i + "src.src = ghimg6.src")
				if (fx){
					eval ("document.getElementById('ghost" + i + "').classList.remove('spin')"); 
				}
			}
		}
	}

	// Return ghost to normal when powerpill wears off.
	if (ppTimer == "0" && powerpilon) {
		powerpilon=false
		mode=previousMode;
		ghostspeed=speed;
		movespeed=speed;
		document.getElementById("maze").classList.remove("spin");
		for(i=0;i<total_ghosts;i++){
			if (!onPath[i]) {
				eval ("ghost" + i + "src.src = ghimg" + i + ".src")
				onPath[i]=false
				eval ("document.getElementById('ghost" + i + "').classList.remove('spin')"); 
				vulnerable[i] = true
				ghostscore=50
			}
		}
	}

	// Check to see if a ghost has gone through the channel to the other side of the screen
	for (i=0;i<total_ghosts;i++){
		ghostPos = mazedata[topG[i]][parseInt(leftG[i])];
		if (ghostPos && (ghostPos.charAt(2)=="O" || ghostPos.charAt(3)=="O")){
			if (leftG[i] <= 35 && ghostDir[i] ==2) {leftG[i] = 555; }
			if (leftG[i] >= 565 && ghostDir[i] ==1) {leftG[i] = 35; }
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
	pac_possibilities = bindata[pacTop][pacLeft];
	

	// 2. If the latest key press has generated a character in the possible moves array, set 'engage', set the movekey var to this key, and also the lastkey var
	if (pac_possibilities && (pac_possibilities & newkey)) {

		engage=true; movekey = newkey; lastkey = newkey // lastkey set to stop constant repetition of last 2 moves without the user touching anything.. see later on.

	} else if (pac_possibilities && (pac_possibilities & lastkey)){

		// 2.1 If previously pressed key generated a character that exists in the possible moves array then we can use that to continue in that direction
			engage = true
			movekey = lastkey

		// 2.2 The latest and last key presses do not match a possible direction - therefore pacman stops. 'engage' and 'moving' set to false
	} else if (!pac_possibilities){
		engage = true;
	} else {
		engage = false
		moving = false
	}
	// 3. Engage is now set if a move can be made. This is either off the new key the previously pressed key, it doesn't matter as we make that move.
	if (engage) {

		if (movekey==newkey) { // 4. This means the latest key press and not the previous one generated this move, so we update the icon to point the right way
			newClass = "pacman_" + newkey;
			document.getElementById("pacman").classList.remove("pacman_1");
			document.getElementById("pacman").classList.remove("pacman_2");
			document.getElementById("pacman").classList.remove("pacman_4");
			document.getElementById("pacman").classList.remove("pacman_8");
			document.getElementById("pacman").classList.add(newClass);
		}

		// 5. Move the sprite on screen to correspond to the direction
		if (movekey==8) {divPacman.top=(pacTop-10); pacTop=pacTop-10}
		if (movekey==4) {divPacman.top=(pacTop+10); pacTop=pacTop+10}
		if (movekey==2) {divPacman.left=(pacLeft-10);pacLeft=pacLeft-10}
		if (movekey==1) {divPacman.left=(pacLeft+10); pacLeft=pacLeft+10}


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
				//document.getElementById("maze").classList.add("spin"); // mushrooms 
				for(i=0;i<total_ghosts;i++){
					if (!onPath[i]){
						eval ("ghost" + i + "src.src=ghimg5.src")
						//eval ("document.getElementById('ghost" + i + "').classList.add('spin')"); // mushrooms 
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
function generateGhostDir(who,howMany,ghost_possibilities){

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

				//possibilities=possibilities.replace(/X/g,"");
				if (mazedata[topG[who]][leftG[who]] == "3" && !onPath(who)){// ghosts can only re-enter the home base when on a path to regenerate 
					ghost_possibilities=ghost_possibilities.replace(/5/g,"");
				}
				if (howMany>2){ // NB: having howmany>2 gives more chances for the ghosts to backtrack on themsleves, making them easier to catch.
					ghost_possibilities=excludeOppositeDirection(who,ghost_possibilities);
					howMany--;
				}
				if (!onPath[who]){

					random_direction = Math.floor(Math.random() *(howMany)) + 1;
					ghostDir[who]=randomDir(ghost_possibilities,random_direction);	

					//console.log("ghostDir for wg " +who + " = " + ghostDir[who] + " from " + ghost_possibilities + " with a rand of " + random_direction);
					if (!ghost_possibilities & ghostDir[who]){
						console.log("ILLEGAL DIRECTION GENERATED FOR !" + who);
					}
				} else {
					ghostDir[who] = headFor(who,ghostHomeBase);
				}

		} else if (ghostMode=="sit"){
			sit_rand_direction=Math.round(Math.random() * 1);
			if (sit_rand_direction==0){ sit_rand_direction==2;}
			if (ghost_possibilities & sit_rand_direction){ ghostDir[who]=sit_rand_direction; } 
			ghostDir[who] = headFor(who,ghostHomeBase);
		}
}

/* Function excludeOppositeDirection
 * Meta: Removes the opposite direction from the list of possible moves - no point in going back where we've just come fron - keeps them moving around 
*/
function excludeOppositeDirection(who,dirs){

	if (ghostDir[who]==1){ return  dirs & ~2;}
	if (ghostDir[who]==2){ return  dirs & ~1;}
	if (ghostDir[who]==4){ return  dirs & ~8;}
	if (ghostDir[who]==8){ return  dirs & ~4;}

	/*
	dirs=(dirs >>> 0).toString(2); // binary conversion

	if (ghostDir[who]==1){
		xreturn = dirs.substr(0, 2) + "0" +  dirs.substr(3,4);
	}	
	if (ghostDir[who]==2){
		xreturn = dirs.substr(0, 3) + "0";
	}
	if (ghostDir[who]==4){
		xreturn = "0" +  dirs.substr(1,4);
	}
	if (ghostDir[who]==8){
		xreturn = dirs.substr(0, 1) + "0" +  dirs.substr(2,4);
	}
	return parseInt(xreturn,2);
*/
}

/* 
 * Function: headFor
 * Param who (string) - index of which ghost we are sending somewhere
 * Param where (array) - 2 item aray of L and R co-ordinates of the cell we are sending the ghost toi
 * Return dir (string) - the direction that can be direcly set for that ghost
*/
function headFor(who,where){
	currentCell = bindata[parseInt([topG[who]])][parseInt(leftG[who])]
	if (!currentCell){
		//return ghostDir[who]; // Doesnt look like i need to do this...
	}

	var dir=null;

	if (leftG[who] > where[0] && (currentCell & 2) && !(ghostDir[who] & 1) && ghostDir[who] != null){
		dir = 2;
	} else if (leftG[who] <= where[0] && (currentCell & 1) && !(ghostDir[who] & 2) && ghostDir[who] != null){
		dir= 1;
	}

	if (topG[who] > where[1] && (currentCell & 8) && !(ghostDir[who] & 4) && ghostDir[who] != null){
		dir=8;
	} else if (topG[who] <= where[1] && (currentCell & 4) && !(ghostDir[who] & 8) && ghostDir[who] != null){
		// stop ghosts going back home
		if ((topG[who]!=145 && leftG[who]!=305) || onPath[who]){
			//console.log("TOP SECTION - set to 4");
			dir=4;
		} else if (topG[who]==145 && leftG[who]==305){
			// cant go back to ghost house
			dir=1;
		} else {
			dir=4;
		}
	}
	// ALERT need a new one for this if (currentCell.charAt(4)=="3"){ dir="U";} // for when ghosts are in the pound
	if (ghostMode=="sit" && topG[who]==ghostStartTop) { dir=8; }
	

	//console.log(ghostDir[who],topG[who],leftG[who],ghostHomeBase[0],ghostHomeBase[1],currentCell.charAt[0],currentCell.charAt[1],currentCell.charAt[2],currentCell.charAt[3],dir);

	// not got a direction? Means we can't head there directly, so lets make a decision 
	// if there are only two possibilities, try and force a 90 degree angle turn, otherwise just go through some defaults.
	// logic is: if its going R or L, force in this order: U,D,L,R 
	// 	     if its going U or D, force in this order: L,R,U,D
	if (!dir) { 
		
		qty_options = qtyBits(currentCell);
		if (qty_options==2){
			if (ghostDir[who]==1 || ghostDir[who]==2){
				if (currentCell & 8){ 
					dir= 8;
				 } else if (currentCell & 4){
					dir= 4;
				} else if (currentCell & 2){
					dir= 2;
				} else {
					dir= 1;
					alert("This wont even happen");
				}
			} else  if (ghostDir[who]==4 || ghostDir[who]==8){
				if (currentCell & 2) {
					dir= 2;
				 } else if (currentCell & 1){
					dir= 1;
				 } else if (currentCell & 8){
					dir= 8;
				} else {
					dir=4;
					alert("This will never happen");
				}
			} 
		} else if (qty_options==1){
				/*
				if (currentCell & 2) {
					dir= 2;
				 } else if (currentCell & 1){
					dir= 1;
				 } else if (currentCell & 8){
					dir= 8;
				} else {
					dir=4;
				}
				*/

				dir = currentCell;

				
		} else if ( qty_options==3 || qty_options ==4){
			// here for 1,3 or 4 possibilities
			// for now, forcing in the order up, right, down, left

			// just keep going? works well for 3 and 4 so far..
			dir = ghostDir[who];
		} else {
			//alert("WHy!!!!");
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
	//console.log("Sending " + who + " to " + dir + " from data: " + currentCell + "      at top:" , topG[who], " left:", leftG[who], "Legal: ", currentCell & dir);
	var legal = currentCell & dir;

	if (!legal){
		console.log("NOT LEGAL MOVE");
		onPause=1;	
	}
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
	if (key=="65" || key=="97" || key == "38") {key=8}
	if (key=="90" || key=="122" || key == "40") {key=4}
	if (key=="78" || key=="110" || key == "37") {key=2}
	if (key=="77" || key=="109" || key == "39") {key=1}

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
	if (ghostDir[wg] == "0") {ghostDir[wg] = 8}
	if (ghostDir[wg] == "1") {ghostDir[wg] = 4}
	if (ghostDir[wg] == "2") {ghostDir[wg] = 2}
	if (ghostDir[wg] == "3") {ghostDir[wg] = 1}
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
	document.getElementById("pacman").classList.remove("pacman_8");
	document.getElementById("pacman").classList.remove("pacman_4");
	document.getElementById("pacman").classList.remove("pacman_2");
	document.getElementById("pacman").classList.add("pacman_1");

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
		ghostDir[i]=8;
	}
	newkey = 1;
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
		if (fx){
			document.getElementById("maze").classList.add("spin");
		}
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
	griddata= renderGrid();
	mazedata=griddata[0];
	bindata=griddata[1];
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
	gameTimer = setTimeout('document.getElementById("maze").classList.remove("spin"); divStart.visibility=\'hidden\'; move(); ghosts();',messageLifetime) 
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
	this.direction = 8;
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
qty_bits_lookup=Array(0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4);
function qtyBits(bin){
	/*
	count = 0;
	for(i = 0; i < bin.length; i++) { // would use map but creating arrays on the fly is LONG in javascript
		count += (bin >> i) & 0x01;
	}
	    return count;
	*/
	return qty_bits_lookup[bin];
}

/* 
 * Function : randomDir
 * Meta: generates a random direction for a ghost by bitshifting the data to find the direction corresponding to the nth set bit
 * Param x - data from the bindata array
 * Param y - take our random number and use the nth set bit from the right
*/
function randomDir(x,n){
	var sum = 0;
	var random_direction = 1;
	for (var i=0;i<4;i++){
		sum += (x >> i) & 1;
		if (i>0){
			random_direction = random_direction *2;
		}
		if (sum == n){ 
			return random_direction; 
		}
	}
	return -1;
}

