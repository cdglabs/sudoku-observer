var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var boldColor = "#000000";
var pencilColor = "#808080";
var magicColor = "#00FF00";

function Sudoku(dimension, x, y) {
	var self = this;

	self.dimension = dimension;
	self.x = x;
	self.y = y;
	self.squares = [];
	// kudoku can only solve regular square region puzzles
	if (Math.sqrt(dimension) == Math.floor(Math.sqrt(dimension)))
		self.solver = sudoku_solver(dimension);
	else
		self.solver = 0;
	self.solution = 0;
	self.solved = false;
	
	self.regions = []; // Used for CheckConflict
	self.horizontals = [];
	self.verticals = [];
	self.refresh = [];

	// Bold the outline of the grid for now
	for (var i = 0; i < dimension+1; i++) {
		self.horizontals[i] = [];
		self.verticals[i] = [];
		self.refresh[i] = [];
		for (var j = 0; j < dimension+1; j++) {
			if (i == 0 || i == dimension)
				self.horizontals[i][j] = true;
			else
				self.horizontals[i][j] = false;
			if (j == 0 || j == dimension)
				self.verticals[i][j] = true;
			else
				self.verticals[i][j] = false;
			self.refresh[i][j] = false;
		}
	}
	
	// True if row/column/region has a conflicting non-hint piece
	self.conflicts = new Object();
	self.conflicts.rows = [];
	self.conflicts.columns = [];
	self.conflicts.regions = [];
	for (var i = 0; i < dimension; i++) {
		self.conflicts.rows[i] = false;
		self.conflicts.columns[i] = false;
		self.conflicts.regions[i] = false;
	}
	
	self.InitializeRegions = function() {
		// Initialize the region arrays
		for (var r = 0; r < self.dimension; r++)
			self.regions[r] = [];
		for (var i = 0; i < self.dimension; i++)
			for (var j = 0; j < self.dimension; j++)
				self.regions[self.squares[i][j].region].push([i, j]);
		
		if (Math.floor(Math.sqrt(dimension)) == Math.sqrt(dimension)) {
			// Identify where to draw the region boundaries
			for (var i = 1; i < self.dimension; i++)
				for (var j = 0; j < self.dimension; j++)
					if (self.squares[i-1][j].region != self.squares[i][j].region)
						self.horizontals[i][j] = true;
			for (var i = 0; i < self.dimension; i++)
				for (var j = 1; j < self.dimension; j++)
					if (self.squares[i][j-1].region != self.squares[i][j].region)
						self.verticals[i][j] = true;
		}
	};
	
	self.CheckConflict = function(r, c) {
		var pieceNum = self.squares[r][c].piece.num;
		if (pieceNum == 0)
			return;
		var squareRegion = self.squares[r][c].region;
		var conflictFound = false;
		
		// Run down the row
		for (var i = 0; i < self.dimension; i++)
			if (i == c)
				continue;
		        else if (self.squares[r][i].piece.num == pieceNum) {
					self.squares[r][i].piece.isConflicting = !self.squares[r][i].piece.isHint;
					self.conflicts.rows[r] = !self.squares[r][i].piece.isHint || !self.squares[r][c].piece.isHint;
					conflictFound = true;
			}

		// Run down the column
		for (var j = 0; j < self.dimension; j++)
			if (j == r)
				continue;
		        else if (self.squares[j][c].piece.num == pieceNum) {
					self.squares[j][c].piece.isConflicting = !self.squares[j][c].piece.isHint;
					self.conflicts.columns[c] = !self.squares[j][c].piece.isHint || !self.squares[r][c].piece.isHint;
					conflictFound = true;
		}
		
		// Run through the region
		for (var k = 0; k < self.dimension; k++) {
			var y = self.regions[squareRegion][k][0];
			var x = self.regions[squareRegion][k][1];
			if (y == r && x == c)
				continue;
			else if (self.squares[y][x].piece.num == pieceNum) {
				self.squares[y][x].piece.isConflicting = !self.squares[y][x].piece.isHint;
				self.conflicts.regions[squareRegion] = !self.squares[y][x].piece.isHint || !self.squares[r][c].piece.isHint;
				conflictFound = true;
			}
		}
		
		if (!self.squares[r][c].piece.isHint)
			self.squares[r][c].piece.isConflicting = conflictFound;
	};

	self.CheckConflicts = function() {
		// Clear the board of conflicts
		for (var i = 0; i < dimension; i++) {
			self.conflicts.rows[i] = false;
			self.conflicts.columns[i] = false;
			self.conflicts.regions[i] = false;
		}
		
		// Check every square
		for (var i = 0; i < dimension; i++)
			for (var j = 0; j < dimension; j++)
				self.CheckConflict(i, j);
	};
	
	// For the tutorial
	self.CheckPartSolved = function(i) {
		if (i < 9) {
			for (var c = 0; c < self.dimension; c++)
				if (self.squares[i][c].piece.num == 0 || self.squares[i][c].piece.isConflicting)
					return false;
			return true;
		}
		else if (i < 18) {
			i -= 9;
			for (var r = 0; r < self.dimension; r++)
				if (self.squares[r][i].piece.num == 0 || self.squares[r][i].piece.isConflicting)
					return false;
			return true;
		}
		else {
			i -= 18;
			for (var j = 0; j < self.dimension; j++) {
				var y = self.regions[i][j][0];
				var x = self.regions[i][j][1];
				if (self.squares[y][x].piece.num == 0 || self.squares[y][x].piece.isConflicting)
					return false;
			}
			return true;
		}
	};
	
	// Solved if no pieces are 0 (i.e. empty) and no piece is conflicting
	self.CheckSolved = function() {
		self.CheckConflicts();
		for (var i = 0; i < self.dimension; i++)
			for (var j = 0; j < self.dimension; j++)
				if (self.squares[i][j].piece.num == 0 || self.squares[i][j].piece.isConflicting) {
					self.solved = false;
					return;
				}
		self.solved = true;
	};

	self.MakeStr = function() {
		var str = "";
		for (var i = 0; i < self.dimension; i++)
			for (var j = 0; j < self.dimension; j++) {
				var piece = self.squares[i][j].piece;
				if (piece.num != 0 && piece.isHint)
					str += piece.text;
				else
					str += '.';
				if (dimension > 9 && (i != dimension - 1 || j != dimension - 1))
					str += ' ';
			}
		return str;
	};
	
	self.Solve = function() {
		if (self.solution == 0)
			// For now assuming each puzzle has a unique solution
			self.solution = self.solver(self.MakeStr());
		
		if (self.solution.length > 0)
			self.solution = self.solution[0];
		else
			self.solution = 0;
	};
	
	self.Update = function() {
		if (self.solution == 0 && self.solver != 0)
			self.Solve();
		for (var i = 0; i < self.squares.length; i++)
			for (var j = 0; j < self.squares.length; j++)
				self.squares[i][j].Update();
	};

	self.Draw = function(blur, refresh) {
		if (!refresh) {
			for (var i = 0; i < self.squares.length; i++)
				for (var j = 0; j < self.squares.length; j++) {
					var	p = self.squares[i][j].piece;
					if (p.num == 0)
						continue;
					
					var dx = Math.abs(p.gotoX - p.x);
					var dy = Math.abs(p.gotoY - p.y);
					if (dx > 1 || dy > 1 || p.dangle != 0) {
						var ix = Math.floor((p.x - self.x) / tileSize);
						var iy = Math.floor((p.y - self.y) / tileSize);
						for (var k = Math.max(0, ix - 1); k < Math.min(dimension+1, ix + 2); k++)
							for (var l = Math.max(0, iy - 1); l < Math.min(dimension+1, iy + 2); l++)
								self.refresh[l][k] = true;
						ctx.clearRect((ix - 1) * tileSize, (iy - 1) * tileSize, tileSize*3, tileSize*3);
					}
				}
			
			for (var i = 0; i < engine.numPool.length; i++)
				for (var j = 0; j < engine.numPool[i].stock.length; j++) {
					var p = engine.numPool[i].stock[j];
					var dx = Math.abs(p.gotoX - p.x);
					var dy = Math.abs(p.gotoY - p.y);
					if (dx > 1 || dy > 1 || p.dangle != 0) {
						var ix = Math.floor((p.x - self.x) / tileSize);
						var iy = Math.floor((p.y - self.y) / tileSize);
						for (var k = Math.max(0, ix - 1); k < Math.min(dimension+1, ix + 2); k++)
							for (var l = Math.max(0, iy - 1); l < Math.min(dimension+1, iy + 2); l++)
								self.refresh[l][k] = true;
						ctx.clearRect((ix - 1) * tileSize, (iy - 1) * tileSize, tileSize*3, tileSize*3);
					}
				}
		}
		else {
			for (var i = 0; i < self.refresh.length; i++)
				for (var j = 0; j < self.refresh[i].length; j++)
					self.refresh[i][j] = true;
		}
		
		var v = [];
		
		// Draw the grid borders
		for (var i = 0; i < self.dimension+1; i++) {
			for (var j = 0; j < self.dimension+1; j++) {
				
				// Draw the vertical lines (non-bold only)
				if (i < self.dimension) {
					if (self.verticals[i][j])
						v.push([i, j]);
					else {
						ctx.fillStyle = pencilColor;
						ctx.fillRect(j*tileSize + x, i*tileSize + y, tileSize/20, tileSize);
					}
				}
				
				// Draw the horizontal lines (bold & non-bold)
				if (j < self.dimension) {
					if (self.horizontals[i][j])
						ctx.fillStyle = boldColor;
					else
						ctx.fillStyle = pencilColor;
					ctx.fillRect(j*tileSize + x, i*tileSize + y, tileSize, tileSize/20);
				}
			}
		}
		
		// Draw the bold vertical lines
		ctx.fillStyle = boldColor;
		for (var k = 0; k < v.length; k++)
			ctx.fillRect(v[k][1]*tileSize + x, v[k][0]*tileSize + y, tileSize/20, tileSize);
		// Fill in the lower-right corner
		ctx.fillRect(dimension*tileSize + x, dimension*tileSize + y, tileSize/20, tileSize/20);
		
		// Draw the squares, deciding whether or not to mask them
		for (var i = 0; i < self.squares.length; i++)
			for (var j = 0; j < self.squares.length; j++) {
				var inRow = i >= blur.top && i < blur.bottom;
				var inColumn = j >= blur.left && j < blur.right;
				var s = self.squares[i][j];
				var show = (blur.restrict && (inRow && inColumn)) || (!blur.restrict && (inRow || inColumn));
				var highlight = self.conflicts.rows[i] || self.conflicts.columns[j] || self.conflicts.regions[s.region];
				if (highlight || (!highlight && s.highlighted) || self.refresh[i][j])
					s.Draw(s.x, s.y, show, blur.fade, highlight);
				self.refresh[i][j] = false;
			}
	};
	
};

function Magic(dimension, x, y) {
	var self = this;

	self.dimension = dimension;
	self.x = x;
	self.y = y;
	self.squares = [];
	self.sums = [];
	self.solved = false;

	// The sum of all the numbers in a magic square is a constant
	// Thus, the sum of each row, column, and diagonal must be
	// this constant divided by the dimension if they are to be equal
	var magicSum = 0;
	for (var i = 1; i <= dimension*dimension; i++)
		magicSum += i;
	magicSum /= dimension;
	
	self.refresh = [];
	for (var i = 0; i < dimension + 2; i++) {
		self.refresh[i] = [];
		for (var j = 0; j < dimension + 1; j++)
			self.refresh[i][j] = false;
	}
	
	self.CheckSolved = function() {
		self.Update();
		self.solved = true;
		window.IS_COMPLETE = true;
		for (var i = 0; i < self.sums.length; i++)
			if (self.sums[i].num != magicSum) {
				self.solved = false;
				window.IS_COMPLETE = false;
				break;
			}
	};

	self.Solve = function() {
		var pos2num = [];
		
		// Center square is always 5
		pos2num[4] = 5;
		
		// All 8 solutions can be determined after setting 2 certain numbers
		var roll8;
		do
			roll8 = Math.floor(Math.random()*8);
		while (roll8 % 2 == 1 || roll8 == 4);
		pos2num[roll8] = 8;
		
		var roll6;
		do
			roll6 = Math.floor(Math.random()*8);
		while (roll6 % 2 == 1 || roll6 == 4 || 
				roll6 == roll8 || roll6 + roll8 == 8);
		pos2num[roll6] = 6;
		
		// Fill in the rest
		pos2num[8 - roll8] = 2;
		pos2num[8 - roll6] = 4;
		pos2num[1] = 15 - pos2num[0] - pos2num[2];
		pos2num[3] = 15 - pos2num[0] - pos2num[6];
		pos2num[5] = 15 - pos2num[2] - pos2num[8];
		pos2num[7] = 15 - pos2num[6] - pos2num[8];
		
		return pos2num;
	};
	
	self.Update = function() {		
		// For a 3x3 magic square, the structure of sums would be
		// [row1_sum, row2_sum, row3_sum, col1_sum, col2_sum, col3_sum, leftDiag_sum, rightDiag_sum]
		for (var i = 0; i < self.squares.length; i++)
			for (var j = 0; j < self.squares.length; j++)
				self.squares[i][j].Update();
		for (var s = 0; s < dimension*2 + 2; s++)
			self.sums[s].num = 0;
		
		// Update the border squares
		for (var i = 0; i < dimension; i++) {
			for (var j = 0; j < dimension; j++) {
				var num = self.squares[i][j].piece.num;
				self.sums[i].num += num;
				self.sums[dimension+j].num += num;
				if (i == j)
					self.sums[dimension*2].num += num;
				if (i + j == dimension - 1)
					self.sums[dimension*2 + 1].num += num;
			}
		}
		
		for (var s = 0; s < dimension*2 + 2; s++) {
			var m = self.sums[s];
			if (m.text != m.num.toString()) {
				m.text = m.num.toString();
				ctx.clearRect(m.x, m.y, tileSize, tileSize);
				self.refresh[m.y / tileSize][m.x / tileSize] = true;
			}
		}
	};

	self.Draw = function(blur, refresh) {
		if (!refresh) {
			for (var i = 0; i < dimension; i++)
				for (var j = 0; j < dimension; j++) {
					var	p = self.squares[i][j].piece;					
					var dx = Math.abs(p.gotoX - p.x);
					var dy = Math.abs(p.gotoY - p.y);
					if (dx > 1 || dy > 1 || p.dangle != 0) {
						var ix = Math.floor((p.x - self.x) / tileSize);
						var iy = Math.floor((p.y - self.y) / tileSize);
						for (var k = Math.max(0, ix - 1); k < Math.min(dimension+2, ix + 2); k++)
							for (var l = Math.max(0, iy - 1); l < Math.min(dimension+1, iy + 2); l++)
								self.refresh[l][k] = true;
						ctx.clearRect((ix - 1) * tileSize, (iy - 1) * tileSize, tileSize*3, tileSize*3);
					}
				}
		}
		else {
			for (var i = 0; i < self.refresh.length; i++)
				for (var j = 0; j < self.refresh[i].length; j++)
					self.refresh[i][j] = true;
		}
		
		// Draw the grid borders
		ctx.fillStyle = pencilColor;
		for (var i = 0; i <= dimension; i++) {
			ctx.fillRect(tileSize + x, i*tileSize + y, tileSize*(dimension+1), tileSize/20);
			ctx.fillRect((i+1)*tileSize + x, y, tileSize/20, tileSize*(dimension+1));
		}
		ctx.fillRect(x, dimension*tileSize + y, tileSize, tileSize/20);
		
		// Draw the sum boxes
		for (var s = 0; s < dimension*2 + 2; s++) {
			var m = self.sums[s];
			if (self.refresh[m.y / tileSize][m.x / tileSize])
				m.Draw(magicSum);
			self.refresh[m.y / tileSize][m.x / tileSize] = false;
		}
		
		// Draw the squares
		for (var i = 0; i < self.squares.length; i++)
			for (var j = 0; j < self.squares.length; j++)
				if (self.refresh[i][j+1]) {
					var s = self.squares[i][j];
					s.Draw(s.x, s.y, true, 0);
					self.refresh[i][j+1] = false;
				}
	};
};