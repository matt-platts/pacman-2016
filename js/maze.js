/* 
 * File: maze.js
 * Meta: functions for creating the maze visual and an array to describe all of the maze cells in terms of possible moves, where pills are etc. 
*/

var pillNumber=0; // count the pills as we add them. This var is used to check if the screen has been completed in the game. 

/* 
 * Function: convert
 * Meta: Convert the original maze data which is a 1d array to a 2d array of rows and columns
 *       This 2d array is stored in the var interim_maze, which is later looped in order to build a bigger array containing every possible move available from each cell.
 *       run convert(maze) to see the result in the console
 */
function convert(maze){
	maze = maze.join("");
	var interim_maze = Array();
	x=0;
	y=0;
	//console.log(maze);
	for (i=0;i<maze.length;i++){
		character = maze.charAt(i);
		if (i==19 || x==19){ // maze is 19 blocks wide, drop to next line
			x = 0;
			//console.log("x is now " + x + " at " + i);
			y++;
		}
		if (x==19) {
			y++;
			//console.log("y is now " + y + " - xz is " + x);
			x=0;
		}
		if (typeof (interim_maze[y]) != "object"){
			interim_maze[y]=Array(); // basically just initialising an array each time there isn't one..
		}
		interim_maze[y][x]=character;
		//console.log(typeof(interim_maze[y]) + " Y: " + interim_maze[y] + " == " + "x is " + x + " and y is " + y + " ======" + interim_maze[y][x]);
		x++;
	}
	return interim_maze;
}

/* 
 * Function : renderGrid
 * Meta: takes the 2d grid and builds a data structure from it that we can query easily. 
 * 	bindata - for binary lookups of possible moves where we can use a bitwise and to see if a move is possible from the current cell.. 
 *      Byte 1 - set to U if can go up, X if not
 *	Byte 2 - set to D if can go down, X if not
 *	Byte 3 - set to L if can go left, X if not
 *	Byte 4 - set to R if can go right, X if not
 *	Byte 5 - set to 1 if a pill is in the cell, 2 if a powerpill, 3 if it is the ghosts home, 4 if the cell goes to an offscreen tunnel, 5 indicates the top of the ghosts home.  
 *               which should only allow movement in one direction (out of the ghosts home) and not in unless the ghost has been eaten
 * 	Byte 6 - In the original version this contained one direction character (U, D, L or R) to tell the ghosts how to get back home. This is no longer used. 
 *
 * 	This function also takes care of screen rendering including pills.
*/
function renderGrid(){
	var interim_maze = convert(maze);
	//interim_maze=randomMaze();
	//interim_maze= convert(testmaze); - only for testing
	//interim_maze=removeDeadBlocksInTest(testmaze); - further testing
	var bindata = Array();
	var binpills = Array();
	var x=0;
	v_offset=25; // start 25px down
	innerStr="";
	for (y=0;y<interim_maze.length;y++){
		var lineMoves = Array();
		h_offset=35; // start a new line 35px in
		bindata[v_offset] = Array();
		for (x=0;x<19;x++){
		
			bit = interim_maze[y][x]; // yeah its a byte not a bit, byte is a reserved word. Ahem..
			binbit = 0;
			var movestring=""; // empty var to take the possible directions

			// populate movestring by scanning the binary array left, right, up and down for more 1's
			if (interim_maze[y-1] && interim_maze[y-1][x] != "0"){
				 movestring="U"; binbit=8;} else { movestring="X";}

			if (interim_maze[y+1] && interim_maze[y+1][x] != "0"){
				 movestring += "D"; binbit += 4; } else { movestring += "X";}

			if (interim_maze[y][x-1] && interim_maze[y][x-1] != "0"){
				 movestring += "L"; binbit += 2;} else { movestring += "X";}

			if (interim_maze[y][x+1] && interim_maze[y][x+1] != "0"){
				 movestring += "R"; binbit += 1; } else { movestring += "X";}

			if (interim_maze[y][x-1] =="3" && interim_maze[y][x+1]=="3"){ binbit = 8;} // stop ghosts L and R in home base

			movestring += bit; // this adds the pill
			lineMoves.push(movestring); // ADD to an array of the whole line

			// This section draws the inner wall of the outer double wall (where x and y are the perimiters).
			// The CSS for the mazecells is no longer used, but anticipating I may again in the future, I'm manually altering it here.
			if (y==0 || x==0 || y==14 || x==18 ){

				styles=movestring.substring(0,4); // we add the 4 move positions to a css class in order to draw the correct borders for the maze

				if (y==0){ // upper edge 
					if (x != 0 && x!=18){
						 styles = styles.replace("XXL","XDL");	
						 styles = styles.replace("XXX","XDL");	
						 styles = styles.replace("XDX","XDL");	
						 styles = styles.replace("XDLX","XDLR");	
					}
				}
				if (y==14){ // lower edge
					styles = styles.replace("XXXR","UXXR");
					styles = styles.replace("XXLR","UXLR");
				}
				if (x==0){ // left edge
					styles = styles.replace("DXX","DXR");
					styles = styles.replace("XXLR","XDLR");
				}
				if (x==18){ // right edge
					styles = styles.replace("UDX","UDL");
					styles = styles.replace("XDX","UDL");
					styles = styles.replace("UXL","UDL");
				}

				styles = styles.replace("XXLR","");
				if (bit==4 && i!=0){
						styles = "UDLR";
				}
				if (bit==4 && y==0){
					styles=styles.replace("XXLX","XDLR");
					styles=styles.replace("XXXR","XDLR");
				}
				if (x==18 && y == 14){ // bottom right corner
					styles = "UXLX";
				}
			
			} else {
				styles="";
			}

			wallStyles = movestring.substring(0,4);

			// 4 is the off side tunnel
			if (bit==4){
				if (x==0){
					styles = styles.replace("XXXR","XXLR"); 
					movestring = movestring.replace("XXXR","XXOR"); 
				} else {
					styles = styles.replace("XXLX","XXLR"); 
					movestring = movestring.replace("XXLX","XXLO"); 
				}
				styles += " " + movestring;
				styles += " mazeTunnel"; 
				cellInnerHTML = "";

			// 5 is the red barrier at the top of the ghosts home base
			} else if (bit==5){
				styles += " ghostbarrier";
				cellInnerHTML = "";
				ghostHomeBase=Array(h_offset,v_offset); // set the return to base position for the game

			// print the pill if it's a cell with 1 in the binary maze
			} else if (bit==1){
				cellInnerHTML="<img src='graphics/pil.gif' name='pil_" + h_offset + v_offset + "'>";
				pillNumber++;

			// 2 is a powerpill
			} else if (bit==2){
				cellInnerHTML="<div id='p" + v_offset + h_offset + "' ><img src='graphics/powerpil.gif' name='pil_" + h_offset + v_offset + "'></div>";
				pillNumber++;

			// 0 is a cell within a wall
			} else {
				cellInnerHTML="<div id='p" + v_offset + h_offset + "' ></div>";
			}

			// add further css for creating the left and right walls on the next row down using css before and after selectors. This takes care of the double walls.
			if (y<14){
				if (movestring.charAt(3)=="R"){
					styles +=" blockLowerRight";
				}
				if (movestring.charAt(2)=="L"){
					styles += " blockLowerLeft";
				}
			}

			// Create the lookup array, which contains data about your possible moves, and print the pills whilst looping.. 
			// The lookup array maps to pixels on the screen so you can look up moves from the top and left properties of the sprites.
			// if it's not a zero in the original maze array, add the html to a string, and add this to innerStr. innerStr is built up and used as innerHTML to the maze div.
			if (bit != "0"){
				str='<div id="cell-' + h_offset + '-' + v_offset + '" data-pills="' + bit + '" style="position:absolute; top:' + v_offset + 'px; left:' + h_offset + 'px;" class="mazeCell ' + styles + '">' + cellInnerHTML + '</div>';
				innerStr += str;
				//binbit = (binbit>>>0).toString(2); // only use this to store in binary notation
				bindata[v_offset][h_offset] = binbit;

			} else {

				str='<div id="cell-' + h_offset + '-' + v_offset + '" style="position:absolute; top:' + v_offset + 'px; left:' + h_offset + 'px;" class="wallCell w_' + wallStyles + '">' + cellInnerHTML + '</div>';
				innerStr += str;
			}

			h_offset = h_offset + 30;

		}
		//console.log("Linemoves: " + lineMoves);
		v_offset = v_offset + 30; 
	}
	document.getElementById('mazeinner').innerHTML=innerStr;
	return bindata;
}

// Randomly generated mazes
function Maze(w, h){ 
        this.w = (isNaN(w) || w < 5 || w > 999 ? 20 : w); 
        this.h = (isNaN(h) || h < 5 || h > 999 ? 20 : h); 
        this.map = new Array();
        for(var mh = 0; mh < h; ++mh) { this.map[mh] = new Array(); for(var mw = 0; mw < w; ++mw) { this.map[mh][mw] = {'n':0,'s':0,'e':0,'w':0,'v':0}; } } 
        this.dirs = ['n', 's', 'e', 'w'];
        this.modDir = { 
                'n' : { y : -1, x : 0, o : 's' },
                's' : { y : 1, x : 0, o : 'n' },
                'e' : { y : 0, x : -1, o : 'w' },
                'w' : { y : 0, x : 1, o : 'e' }
        };  

        this.build(0, 0); 
}

Maze.prototype.toGrid = function(){
        var grid = new Array();
        for(var mh = 0; mh < (this.h * 2 + 1); ++mh) { 
                grid[mh] = new Array(); 
                for(var mw = 0; mw < (this.w * 2 + 1); ++mw) { 
                        grid[mh][mw] = 0; } 
                }   

        for(var y = 0; y < this.h; ++ y){ 
                var py = (y * 2) + 1;

                for(var x = 0; x < this.w; ++x){
                        var px = (x * 2) + 1;

                        if(this.map[y][x].v==1) {
                                grid[py][px] = 1;
                        }   

                        for(d in this.dirs){
                                if(this.map[y][x][this.dirs[d]]==1) {
                                         grid[(py+this.modDir[this.dirs[d]].y)][(px+this.modDir[this.dirs[d]].x)] = 1;
                                }   
                        }   
                }   
        }   

        this.gridMap = grid;
        this.gridW      = grid.length;
        this.gridH      = grid[0].length;
};

Maze.prototype.build = function(x, y){ 
        var x = 0;
        var y = 0;

        this.explore(x, y); 
        this.toGrid();
};

Maze.prototype.explore = function(ex, ey){
        this.dirs = sortRand(this.dirs);

        for(d in this.dirs){
                var nx = ex + this.modDir[this.dirs[d]].x;
                var ny = ey + this.modDir[this.dirs[d]].y;

                if(nx >= 0 && nx < this.w && ny >= 0 && ny < this.h && this.map[ny][nx].v==0){
                        this.map[ey][ex][this.dirs[d]] = 1;
                        this.map[ey][ex].v = 1;
                        this.map[ny][nx][this.modDir[this.dirs[d]].o] = 1;

                        this.explore(nx, ny);
                }
        }
};


function sortRand(a){
        var out = new Array();
        var l   = a.length;

        for(x in a){
                do { var p = Math.floor(Math.random() * (l * 1000)) % l; } while(typeof out[p]!='undefined');

                out[p] = a[x];
        }

        return out;
}

function randomMaze(){

        mazeMap = new Maze(10,8);

	// remove top and bottom walls
        mazeMap.gridMap.shift();
        mazeMap.gridMap.pop();
	//  remove left and right walls
        for (i=0;i<mazeMap.gridMap.length;i++){
                mazeMap.gridMap[i].pop();
                mazeMap.gridMap[i].shift();

        }

        //document.getElementById("sourcear").innerHTML=mazeMap.gridMap.toString();
	addPowerPills();
	removeDeadBlocks();
        addGhostHome();
        return mazeMap.gridMap;

}

function addGhostHome(){

	var ghost_home_y = Array(2,4,8,10); // possible start positions for ghost home. Need to adjust where fruit appear (underneath), where the ghosts start and where pacman starts for anything other than 4
	var y=4;

	mazeMap.gridMap[y][7]=1;
	mazeMap.gridMap[y][6]=1;
	mazeMap.gridMap[y][8]=1;
	mazeMap.gridMap[y][9]=1;
	mazeMap.gridMap[y][10]=1;
	mazeMap.gridMap[y][11]=1;
	mazeMap.gridMap[y][12]=1;

	y++;
	mazeMap.gridMap[y][6]=1;
	mazeMap.gridMap[y][7]=0;
	mazeMap.gridMap[y][8]=0;
	mazeMap.gridMap[y][9]=5;
	mazeMap.gridMap[y][10]=0;
	mazeMap.gridMap[y][11]=0;
	mazeMap.gridMap[y][12]=1;
	
	y++;
	mazeMap.gridMap[y][6]=1;
	mazeMap.gridMap[y][7]=0;
	mazeMap.gridMap[y][8]=3;
	mazeMap.gridMap[y][9]=3;
	mazeMap.gridMap[y][10]=3;
	mazeMap.gridMap[y][11]=0;
	mazeMap.gridMap[y][12]=1;

	y++;
	mazeMap.gridMap[y][6]=1;
	mazeMap.gridMap[y][7]=0;
	mazeMap.gridMap[y][8]=0;
	mazeMap.gridMap[y][9]=0;
	mazeMap.gridMap[y][10]=0;
	mazeMap.gridMap[y][11]=0;
	mazeMap.gridMap[y][12]=1;

	y++;
	mazeMap.gridMap[y][6]=1;
	mazeMap.gridMap[y][7]=1;
	mazeMap.gridMap[y][8]=1;
	mazeMap.gridMap[y][9]=1;
	mazeMap.gridMap[y][10]=1;
	mazeMap.gridMap[y][11]=1;
	mazeMap.gridMap[y][12]=1;
}
	
function addPowerPills(){
	mazeMap.gridMap[0][0]=2;
	mazeMap.gridMap[14][0]=2;
	mazeMap.gridMap[0][18]=2;
	mazeMap.gridMap[14][18]=2;

}

function removeDeadBlocks(){
// anywhere there is 0 in the map bounded by 0 on a diagonal corner - change the diagonal corner to a 1 
// we need to scan  all diagonals so start second row down and finish one row up.

// example data:
// here second row down second value in is a 0. See diagonal top right is also 0 - this 0 should become a 1
//
//
//	2,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,2,
//	1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,
//	1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,
//	0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,
//	0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,
//	1,0,1,0,0,0,0,0,0,5,0,0,1,0,1,0,0,0,1,
//	1,0,1,1,1,1,1,0,3,3,3,0,1,0,1,1,1,1,1,
//	1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,
//	1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,
//	1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,
//	1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,0,
//	1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,
//	1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,0,
//	1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,
//	2,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,2
//
//

interim= mazeMap.gridMap;

	for (i=1;i<interim.length;i++){

		for (j=1;j<interim[i].length-1;j++){
			if(interim[i][j]==0){
				if (interim[i-1][j+1]==0){
					interim[i-1][j+1]=1;
				}
				if (i<interim.length-1){
					if (interim[i+1][j-1]==0){
						interim[i+1][j-1]=1;
					}
				}
			}
		}
	}
mazeMap.gridMap=interim;
}

function removeDeadBlocksInTest(){
	// anywhere there is 0 in the map bounded by 0 on a diagonal corner - change the diagonal corner to a 1 
	// we need to scan  all diagonals so start second row down and finish one row up.

	// example data:
	// here second row down second value in is a 0. See diagonal top right is also 0 - this 0 should become a 1
	//
	//
	//	2,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,2,
	//	1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,
	//	1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,
	//	0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,
	//	0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,
	//	1,0,1,0,0,0,0,0,0,5,0,0,1,0,1,0,0,0,1,
	//	1,0,1,1,1,1,1,0,3,3,3,0,1,0,1,1,1,1,1,
	//	1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,
	//	1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,
	//	1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,
	//	1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,0,
	//	1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,
	//	1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,0,
	//	1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,
	//	2,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,2
	//
	//

	interim= convert(testmaze);

		for (i=1;i<interim.length;i++){

			for (j=1;j<interim[i].length-1;j++){
				if(interim[i][j]==0){
					if (interim[i-1][j+1]==0){
						interim[i-1][j+1]=1;
					}
					if (i<interim.length-1){
						if (interim[i+1][j-1]==0){
							interim[i+1][j-1]=1;
						}
					}
				}
			}
		}
	return interim;
}

var testmaze= Array (

	2,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,2,
	1,0,1,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,1,
	1,1,1,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,
	0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,
	0,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,
	1,0,1,0,0,0,0,0,0,5,0,0,1,0,1,0,0,0,1,
	1,0,1,1,1,1,1,0,3,3,3,0,1,0,1,1,1,1,1,
	1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,
	1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,
	1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,
	1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,0,
	1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,0,
	1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,0,
	1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,
	2,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,2
)
