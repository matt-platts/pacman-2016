var globals = [];
globals.score = 0;
globals.lives = 3,
globals.level = 1,
globals.speed = 42,
globals.exlife1 = 1,
globals.exlife2 = 1,
globals.gameTime = 2000;

globals.basicVision = false; // set to 1 and the ghosts can see you if there is no wall between you and them in scatter mode, and move towards you (or away if a powerill is on) 
globals.resetModeOnResetGame = true; // set to 1 to always start back in scatter mode, it can be un-nerving when they jump on you at the start of a new level or after you lost a life. Can be over-ridden locally in maze data for individual mazes.
globals.excludeReverseDirectionInRandomMode = true; // a better chance to catch them if they double back on themselves.


for (x in globals){
	sessionStorage.setItem(x,globals[x]);
}
