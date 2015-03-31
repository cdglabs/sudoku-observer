var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

var hardPuzzles = [
	"..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9",
	".......12........3..23..4....18....5.6..7.8.......9.....85.....9...4.5..47...6...",
	".2..5.7..4..1....68....3...2....8..3.4..2.5.....6...1...2.9.....9......57.4...9..",
	"........3..1..56...9..4..7......9.5.7.......8.5.4.2....8..2..9...35..1..6........",
	"12.3....435....1....4........54..2..6...7.........8.9...31..5.......9.7.....6...8",
	"1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1",
	".......39.....1..5..3.5.8....8.9...6.7...2...1..4.......9.8..5..2....6..4..7.....",
	"12.3.....4.....3....3.5......42..5......8...9.6...5.7...15..2......9..6......7..8",
	"..3..6.8....1..2......7...4..9..8.6..3..4...1.7.2.....3....5.....5...6..98.....5.",
	"1.......9..67...2..8....4......75.3...5..2....6.3......9....8..6...4...1..25...6.",
	"..9...4...7.3...2.8...6...71..8....6....1..7.....56...3....5..1.4.....9...2...7..",
	"....9..5..1.....3...23..7....45...7.8.....2.......64...9..1.....8..6......54....7",
	"4...3.......6..8..........1....5..9..8....6...7.2........1.27..5.3....4.9........",
	"7.8...3.....2.1...5.........4.....263...8.......1...9..9.6....4....7.5...........",
	"3.7.4...........918........4.....7.....16.......25..........38..9....5...2.6.....",
	"........8..3...4...9..2..6.....79.......612...6.5.2.7...8...5...1.....2.4.5.....3",
	".......1.4.........2...........5.4.7..8...3....1.9....3..4..2...5.1........8.6...",
	".......12....35......6...7.7.....3.....4..8..1...........12.....8.....4..5....6..",
	"1.......2.9.4...5...6...7...5.3.4.......6........58.4...2...6...3...9.8.7.......1",
	".....1.2.3...4.5.....6....7..2.....1.8..9..3.4.....8..5....2....9..3.4....67....."
	];

var engine;
function Engine(dimension, tileSize, mode, x, y) {
	var self = this;
	
	self.x = x;
	self.y = y;
	self.pieceDragged = false;
	self.useImages = false;
	self.mode = mode;
	self.numPool = [];
	self.blur = new Object();
	self.blur.left = 0;
	self.blur.right = dimension;
	self.blur.top = 0;
	self.blur.bottom = 1;
	self.blur.fade = 0;
	self.blur.restrict = true;
	self.blurPhase = 0;
	self.startTutorial = false;
	self.startTime = 0;
	self.curTime = 0;
	
	if (mode == "sudoku") {
		self.puzzle = new Sudoku(dimension, x, y);
		var sx, sy;
		
		// Populate the grid with empty squares
		for (var i = 0; i < dimension; i++) {
			self.puzzle.squares[i] = [];
			for (var j = 0; j < dimension; j++) {
				sx = j*tileSize + self.puzzle.x;
				sy = i*tileSize + self.puzzle.y;
				var rd = Math.sqrt(dimension);
				var region;
				if (Math.floor(rd) == rd)
					region = Math.floor(i/rd)*rd + Math.floor(j/rd);
				else
					region = i;
				self.puzzle.squares[i].push(new Square(region, new Piece(0, false, sx, sy), sx, sy));
				self.puzzle.squares[i][j].piece.inPuzzle = true;
			}
		}
		self.puzzle.InitializeRegions();
		
		// Generate the numPools, placing them to the right of the grid
		for (var i = 0; i < dimension; i++) {
			sx = dimension*tileSize + self.x;
			sy = i*tileSize + self.y;
			self.numPool[i] = new PieceContainer(sx, sy);
			for (var j = 0; j < dimension; j++)
				self.numPool[i].stock.push(new Piece(i+1, false, 0, 0));
		}
		
		self.puzzle.CheckSolved();
	}
	
	else if (mode == "magic") {
		self.puzzle = new Magic(dimension, x, y);
		var sx, sy;
		
		// Populate the grid with empty squares
		for (var i = 0; i < dimension; i++) {
			self.puzzle.squares[i] = [];
			for (var j = 0; j < dimension; j++) {
				sx = (j+1)*tileSize + self.puzzle.x;
				sy = i*tileSize + self.puzzle.y;
				self.puzzle.squares[i].push(new Square(0, new Piece(i*dimension + (j+1), false, sx, sy), sx, sy));
				self.puzzle.squares[i][j].piece.inPuzzle = true;
			}
		}
		
		// Generate the sum boxes
		for (var s = 0; s < dimension*2 + 2; s++) {
			// Row sums
			if (s < dimension) {
				sx = (dimension+1)*tileSize;
				sy = s*tileSize;
			}
			// Column sums
			else if (s < dimension*2) {
				sx = (s-2)*tileSize;
				sy = dimension*tileSize;
			}
			// Left diagonal sum
			else if (s == dimension*2) {
				sx = (dimension+1)*tileSize;
				sy = dimension*tileSize;
			}
			// Right diagonal sum
			else {
				sx = 0;
				sy = dimension*tileSize;
			}
			sx += self.x;
			sy += self.y;
			self.puzzle.sums.push(new SumBox(sx, sy));
		}
	}
	
	// Wipe the board
	self.Clear = function() {
		for (var i = 0; i < dimension; i++)
			for (var j = 0; j < dimension; j++) {
				if (self.puzzle.squares[i][j].piece.num != 0) {
					self.puzzle.squares[i][j].piece.isHint = false;
					self.RemovePiece(self.puzzle.squares[i][j].piece);
					self.puzzle.squares[i][j].piece = new Piece(0, false, 0, 0);
				}
			}
		
		self.puzzle.CheckSolved();
		self.startTime = 0;
	};
	
	// I.e. clear but leave the hints intact
	self.Reset = function() {
		if (self.blurPhase != 0)
			return;

		for (var i = 0; i < dimension; i++)
			for (var j = 0; j < dimension; j++) {
				if (self.puzzle.squares[i][j].piece.num != 0 &&
						!self.puzzle.squares[i][j].piece.isHint) {
					self.RemovePiece(self.puzzle.squares[i][j].piece);
					self.puzzle.squares[i][j].piece = new Piece(0, false, 0, 0);
				}
			}
		
		self.puzzle.CheckSolved();
		self.startTime = 0;
	};
	
	self.LoadConfiguration = function(puzzleStr) {
		self.Clear();
		
		var tokenArray = puzzleStr.split(' ');
		for (var i = 0; i < dimension; i++)
			for (var j = 0; j < dimension; j++) {
				var a;
				if (dimension < 10)
					a = puzzleStr.charAt(i*dimension + j) >= '1' &&	puzzleStr.charAt(i*dimension + j) <= dimension.toString().charAt(0)
						? puzzleStr.charCodeAt(i*dimension + j) - 48 : 0;
				else {
					a = parseInt(tokenArray[i*dimension + j], 10);
					if (isNaN(a))
						a = 0;
				}
				if (a != 0) {
					var p = self.numPool[a-1].stock[0];
					self.PlacePiece(p);
					self.puzzle.squares[i][j].piece = p;
					p.isHint = true;
				}
			}
	};

	self.InitializeSlider = function() {
		self.slider = new Slider(self.x + dimension*tileSize * (1/3 + 1/16), self.y + (dimension+0.67)*tileSize,
				dimension*tileSize * (2/3 - 1/8), dimension);
	};
	
	self.InitializeTutorial = function() {
		self.blurPhase = 1;
		self.startTutorial = 0;
		self.puzzle.solution = 0;
		// Adapted from https://attractivechaos.github.io/plb/kudoku.html
		var tutorial = "1743.5962.9.4...5...6.9.7...5.923.......7.......85..4.7.....6...3..1948...2.3.5.1";
		self.LoadConfiguration(tutorial);
	};
	
	// Permute will take very long for low numbers of hints because it does a
	// brute-force search over all n-hint configurations to find one with a unique solution.
	// This is a simpler version that takes a known puzzle and just permutes the numbers.
	self.PermuteSimple = function() {
		var puzzleStr = hardPuzzles[Math.floor(Math.random() * 20)];
		var domain = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
		var mapping = domain.splice(0);
		shuffleArray(mapping);
		
		var newPuzzle = "";
		for (var i = 0; i < dimension * dimension; i++)
			if (puzzleStr.charAt(i) == '.')
				newPuzzle += '.';
			else
				newPuzzle += mapping[puzzleStr.charCodeAt(i) - 49];
		
		self.LoadConfiguration(newPuzzle);
		self.puzzle.solution = self.puzzle.solver(newPuzzle)[0];
		self.puzzle.solved = false;
	};
	
	// Swaps rows, permutes the number domain, and randomly assigns hints
	self.Permute = function(puzzleStr, numHints) {
		var funcStartTime = (new Date()).getTime();
		
		var rootDim = Math.sqrt(dimension);
		var substrings = [];
		for (var i = 0; i < dimension; i++)
			substrings[i] = puzzleStr.substr(i*dimension, dimension);
		
		// Swap block rows
		for (var i = 0; i < rootDim; i++) {
			if (Math.random() < .5)
				continue;
			
			var swapA = Math.floor(Math.random() * rootDim);
			var swapB = swapA;
			while (swapB == swapA)
				swapB = Math.floor(Math.random() * rootDim);
			swapA *= rootDim;
			swapB *= rootDim;
			for (var j = 0; j < rootDim; j++) {
				var temp = substrings[swapA+j];
				substrings[swapA+j] = substrings[swapB+j];
				substrings[swapB+j] = temp;
			}
		}
		
		// Swap individual rows
		for (var i = 0; i < rootDim; i++) {
			if (Math.random() < .5)
				continue;
			
			var swapA = Math.floor(Math.random() * rootDim);
			var swapB = swapA;
			while (swapB == swapA)
				swapB = Math.floor(Math.random() * rootDim);
			var blockRow = Math.floor(Math.random() * rootDim);
			swapA += blockRow * rootDim;
			swapB += blockRow * rootDim;
			var temp = substrings[swapA];
			substrings[swapA] = substrings[swapB];
			substrings[swapB] = temp;
		}
		
		var swapped = "";
		for (var i = 0; i < dimension; i++)
			swapped += substrings[i];
		
		var domain = [];
		for (var i = 0; i < dimension; i++)
			domain[i] = i + 1;
		var mapping = domain.splice(0);
		shuffleArray(mapping);
		
		// Look for a configuration with a unique solution.
		var solution = [];
		while (solution.length != 1) {
			var newPuzzle = "";
			for (var i = 0; i < dimension * dimension; i++)
				newPuzzle += '.';
			
			for (var i = 0; i < numHints; i++) {
				var index;
				do 
					index = Math.floor(Math.random() * dimension * dimension);
				while (newPuzzle.charAt(index) != '.');
				newPuzzle = newPuzzle.substr(0, index) + mapping[swapped.charCodeAt(index) - 49] + newPuzzle.substr(index+1);
			}
			
			self.LoadConfiguration(newPuzzle);
			solution = self.puzzle.solver(newPuzzle);
			// When numHints is low, it may be difficult or impossible to
			// find a configuration that only admits a single solution.
			// We do not want Permute to run forever if this is the case.
			if ((new Date()).getTime() - funcStartTime > 2500)
				break;
		}
		self.puzzle.solution = solution[0];
		self.puzzle.solved = false;
	};
	
	self.GetSquare = function(x, y) {
		// Determine the index in the squares array
		var ix = Math.floor((x-self.puzzle.x) / tileSize);
		if (mode == "magic")
			ix -= 1;
		var iy = Math.floor((y-self.puzzle.y) / tileSize);
		
		// Give undefined if the square is being hidden
		if (mode == "sudoku") {
			var inRow = iy >= self.blur.top && iy < self.blur.bottom;
			var inColumn = ix >= self.blur.left && ix < self.blur.right;
			var show = (self.blur.restrict && (inRow && inColumn)) || (!self.blur.restrict && (inRow || inColumn));
			if (!show || ix < 0 || ix >= dimension ||
					iy < 0 || iy >= dimension || self.puzzle.squares[iy][ix].piece.isHint)
				return undefined;
		}
		
		if (ix >= 0 && ix < dimension && iy >= 0 && iy < dimension)
			return self.puzzle.squares[iy][ix];
		else
			return undefined;
	};
	
	self.PlacePiece = function(piece) {
		if (piece.num != 0) {
			piece.inPuzzle = true;
			self.numPool[piece.num-1].stock.splice(0, 1);
		}
	};
	
	self.RemovePiece = function(piece) {
		if (piece.num != 0) {
			piece.isConflicting = false;
			piece.inPuzzle = false;
			self.numPool[piece.num-1].stock.push(piece);
		}
	};
	
	self.KeyPress = function(event) {
		var index = event.charCode - 49;
		if (((index < 0 || index >= dimension) && index != 65) || engine.pieceDragged ||
				(index >= 0 && index <= 8 && self.numPool[index].stock.length == 0))
			return;
		
		// I.e. the 'r' key
		if (index == 65) {
			var removeSquare = engine.GetSquare(Mouse.x, Mouse.y);
			if (removeSquare != undefined) {
				engine.RemovePiece(removeSquare.piece);
				removeSquare.piece = new Piece(0, false, pickupX, pickupY);
				self.puzzle.CheckSolved();
			}
			return;
		}
		
		var p = self.numPool[index].stock[0];
		p.dragged = true;
		engine.pieceDragged = true;
		// Set pickupX/Y to a large number so Piece knows this is a numPool piece
		pickupX = 9000;
		pickupY = 9000;
		clicked = false;
		draggedPiece = p;
	};
	
	self.GiveHint = function() {
		if (self.puzzle.solution == 0 || self.puzzle.solved || self.blurPhase != 0)
			return;
		
		// Initialize empty and wrong arrays
		// Either fill in an empty box if the corersponding numPool is available
		// Else remove an incorrect piece from the grid
		var empty = [];
		var wrong = [];
		for (var i = 0; i < dimension; i++)
			for (var j = 0; j < dimension; j++) {
				if (self.puzzle.squares[i][j].piece.num == 0)
					empty.push([i, j]);
				else if (self.puzzle.squares[i][j].piece.isConflicting)
					wrong.push([i, j]);
			}
		
		while (empty.length > 0) {
			var index = Math.floor(Math.random()*empty.length);
			i = empty[index][0];
			j = empty[index][1];
			var num = self.puzzle.solution[i*dimension + j];
			if (self.numPool[num-1].stock.length == 0) {
				empty.splice(index, 1);
				continue;
			}
			else {
				var p = self.numPool[num-1].stock[0];
				self.PlacePiece(p);
				self.puzzle.squares[i][j].piece = p;
				self.puzzle.squares[i][j].hasHint = true;
				self.puzzle.squares[i][j].hintNum = p.num;
				self.puzzle.CheckSolved();
				return;
			}
		}
		
		while (wrong.length > 0) {
			var index = Math.floor(Math.random()*wrong.length);
			i = wrong[index][0];
			j = wrong[index][1];
			var num = self.puzzle.solution[i*dimension + j];
			var p = self.puzzle.squares[i][j].piece;
			if (p.num == num) {
				wrong.splice(index, 1);
				continue;
			}
			else {
				self.RemovePiece(p);
				self.puzzle.squares[i][j].piece = new Piece(0, false, 0, 0);
				self.puzzle.CheckSolved();
				return;
			}
		}
		
		self.puzzle.CheckSolved();
	};
	
	// Fill in the board with a known solution
	self.SetSolution = function() {
		if (mode == "sudoku") {
			if (self.puzzle.solution == 0 || self.puzzle.solved || self.blurPhase != 0)
				return;
			
			var empty = [];
			for (var i = 0; i < dimension; i++)
				for (var j = 0; j < dimension; j++) {
					if (self.puzzle.squares[i][j].piece.num != self.puzzle.solution[i*dimension + j]) {
						self.RemovePiece(self.puzzle.squares[i][j].piece);
						empty.push([i, j]);
					}
				}

			for (var e = 0; e < empty.length; e++) {
				var i = empty[e][0];
				var j = empty[e][1];
				var p = self.numPool[self.puzzle.solution[i*dimension+j]-1].stock[0];
				self.PlacePiece(p);
				self.puzzle.squares[i][j].piece = p;
				self.puzzle.squares[i][j].hasHint = true;
				self.puzzle.squares[i][j].hintNum = p.num;
			}

			self.puzzle.CheckSolved();
		}
		
		else if (mode == "magic") {
			var pos2num = self.puzzle.Solve();
			var num2pos = [];
			for (var i = 0; i < pos2num.length; i++)
				num2pos[pos2num[i]] = i;
			
			var changed = false;
			for (var i = 0; i < 3; i++)
				for (var j = 0; j < 3; j++) {
					var pickupSquare = self.puzzle.squares[i][j];
					var num = pickupSquare.piece.num;
					while (num != pos2num[i*3 + j]) {
						changed = true;
						var dropSquare = self.puzzle.squares[Math.floor(num2pos[num] / 3)][num2pos[num] % 3];
						var temp = dropSquare.piece;
						dropSquare.piece = pickupSquare.piece;
						pickupSquare.piece = temp;
						num = pickupSquare.piece.num;
					}
				}
			
			if (!changed)
				self.SetSolution();
			else
				self.puzzle.solved = true;
		}
	};
	
	self.Update = function() {
		self.puzzle.Update();
		self.puzzle.Draw(self.blur);
		if (mode == "magic")
			return;
		
		if (self.slider != undefined) {
			self.slider.Update();
			self.slider.Draw();
		}
		
		if (self.startTutorial)
			self.InitializeTutorial();
		
		if (self.blur.fade > 0) {
			self.blur.fade += 1;
			if (self.blur.fade == 75) {
				self.blurPhase = (self.blurPhase + 1) % 4;
				if (engine.blurPhase == 2) {
					unhide("phase1");
					unhide("phase2");
				}
				else if (engine.blurPhase == 3) {
					unhide("phase2");
					unhide("phase3");
				}
				else if (engine.blurPhase == 0) {
					unhide("phase3");
					unhide("phase0");
					unhide("buttons");
				}
			}
			else if (self.blur.fade == 150)
				self.blur.fade = 0;
		}
		
		// At any point you can reset, but you must move incrementally from 0 to 3
		switch (self.blurPhase) {
		case 0:
			self.blur.left = 0;
			self.blur.right = dimension;
			self.blur.top = 0;
			self.blur.bottom = dimension;
			self.blur.restrict = true;
			break;
		case 1:
			self.blur.bottom = 1;
			break;
		case 2:
			self.blur.left = 3;
			self.blur.right = 6;
			self.blur.bottom = dimension;
			break;
		case 3:
			self.blur.left = 6;
			self.blur.right = dimension;
			self.blur.top = 6;
			self.blur.restrict = false;
			break;
		}
	};
};

// Maybe move this into an engine.Draw()?
var justDropped;
var movesUntilSolve = 15;
var history = 0;
function render() {
	if (assetsLeft > 0) return;
	
	if (Mouse.pressed && !clicked && !clickLock) {
		clicked = true;
		clickLock = true;
	}
	else if (Mouse.pressed && clicked) {
		clicked = false;
	}
	else if (!Mouse.pressed) {
		clicked = false;
		clickLock = false;
	}
	
	if (window.location.search == "?log=true") {
		var str = "";
		if (Mouse.pressed)
			str += "Mouse down; ";
		else
			str += "Mouse up; ";
		if (clicked)
			str += "clicked is true";
		if (!clicked)
			str += "clicked is false";
		console.log(str);
	}
	
	if (Mouse.pressed)
		Mouse.pressed = false;
	
	ctx.font = font;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	if (draggedPiece != 0 && !document.hasFocus() && engine.mode == "sudoku") {
		var pickupSquare = engine.GetSquare(pickupX, pickupY);
		if (pickupSquare != undefined) {
			engine.RemovePiece(draggedPiece);
			pickupSquare.piece = new Piece(0, false, pickupX, pickupY);
		}
		draggedPiece.dragged = false;
		engine.pieceDragged = false;
		draggedPiece = 0;
	}
	
	engine.Update();
	if (engine.mode == "sudoku")
		for (var p = 0; p < engine.numPool.length; p++)
			engine.numPool[p].Draw();
	
	if (draggedPiece != 0) {
		draggedPiece.Draw(draggedPiece.x, draggedPiece.y);
		justDropped = true;
	}
	
	else if (justDropped) {
		justDropped = false;
		if (engine.mode == "magic" && movesUntilSolve > 0) {
			--movesUntilSolve;
			if (movesUntilSolve == 6)
				unhide("hint");
			else if (movesUntilSolve == 0)
				unhide("buttons");
		}
		engine.puzzle.CheckSolved();
		
		if ((engine.blurPhase == 1 && engine.puzzle.CheckPartSolved(0))
				|| (engine.blurPhase == 2 && engine.puzzle.CheckPartSolved(4+9))
				|| (engine.blurPhase == 3 && engine.puzzle.CheckPartSolved(8+18)))
			if (engine.blur.fade == 0)
				engine.blur.fade = 1;
	}
	
	// Update timer
	if (engine.startTime > 0 && !engine.puzzle.solved) {
		engine.curTime = Math.floor(((new Date()).getTime() - engine.startTime) / 1000);
		document.getElementById("timer").innerHTML = engine.curTime.toString() + " s";
	}
	else if (engine.startTime == 0 && document.getElementById("timer"))
		document.getElementById("timer").innerHTML = "Start Timer";
	
	// Signal overlying html to reveal navigation buttons
	if (engine.puzzle.solved) {
		window.IS_COMPLETE = true;
		engine.startTime = 0;
	}
		
	lastMouseX = Mouse.x;
	lastMouseY = Mouse.y;
}

////////////////////
//ANIMATION LOOP //
////////////////////
window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };

(function animloop(){
	requestAnimFrame(animloop);
	if(window.IS_IN_SIGHT){
		render();
	}
})();

window.IS_IN_SIGHT = false;

/*window.onload=function(){
	reset();
};*/