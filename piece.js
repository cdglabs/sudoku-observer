var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var font = "20px Domine";
var fontHeight = 15;
var normalColor = "#0000FF";
var conflictColor = "#FF0000";
var hintColor = "#404040";
var selectColor = "#FF8000";
var outsideColor = "#0000FF";

var images = {};
var assetsLeft = 0;
var onImageLoaded = function(){
	assetsLeft--;
};

function addAsset(name,src){
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onImageLoaded;
	images[name].src = src;
}

var clicked = false;
var clickLock = false;
var draggedPiece = 0;
var pickupX;
var pickupY;
var lastMouseX;
var lastMouseY;
var engine;
function Piece(num, isHint, x, y) {
	var self = this;
	
	self.num = num;
	self.text = self.num.toString();
	self.isHint = isHint;
	self.isConflicting = false;
	self.inPuzzle = false;
	self.isSliding = false;
	self.x = x;
	self.y = y;
	self.gotoX = x;
	self.gotoY = y;
	self.dragged = false;
	self.frame = 0;
	self.dangle = 0;
	self.dangleVel = 0;
	self.width = ctx.measureText(self.text).width;
	
	self.Update = function(show) {
		// For some reason this differs from self.width; textOffset gives correct results...
		textOffset = ctx.measureText(self.text).width;
		
		// If the square is not being masked and there is a click event to process...
		if (show && clicked && !self.isHint) {
			if (!self.dragged) {
				// Make sure nothing else is already being dragged
		        if (!engine.pieceDragged) {
					var square = self.isSliding ? engine.GetSliding(Mouse.x, Mouse.y) : engine.GetSquare(Mouse.x, Mouse.y);
					var pool = self.inPuzzle ? undefined : engine.GetPool(Mouse.x, Mouse.y);
					if(((square != undefined && square.piece == self)
							|| (pool != undefined && pool.stock[0] == self)) && self.num != 0) {
						pickupX = Mouse.x;
						pickupY = Mouse.y;
						self.dragged = true;
						engine.pieceDragged = true;
						clicked = false;
						draggedPiece = self;
					}
		        }
			}
			
			else {
				// engine.GetSquare returns undefined if the coordinates are outside the grid
				// or if the corresponding square is being hidden by the engine
				var pickupSquare = engine.GetSquare(pickupX, pickupY);
				var dropSquare = engine.GetSquare(Mouse.x, Mouse.y);
				
				// In -> In
				if (pickupSquare != undefined && dropSquare != undefined) {
					if (dropSquare.piece.isHint)
						dropSquare = pickupSquare;
					var temp = pickupSquare.piece;
					pickupSquare.piece = dropSquare.piece;
					dropSquare.piece = temp;
				}
				
				// In -> Out
				else if (engine.mode != "magic" && pickupSquare != undefined && dropSquare === undefined) {
					engine.RemovePiece(self);
					pickupSquare.piece = new Piece(0, false, pickupX, pickupY);
				}
				
				// Out -> In
				else if (engine.mode != "magic" && pickupSquare === undefined && dropSquare != undefined) {
					if (!dropSquare.piece.isHint) {
						engine.RemovePiece(dropSquare.piece);
						engine.PlacePiece(self);
						dropSquare.piece = self;
					}
				}
				self.dragged = false;
				engine.pieceDragged = false;
				clicked = false;
				draggedPiece = 0;
			}
		}
		
		// Follow the mouse
		if (self.dragged) {
			self.gotoX = Mouse.x;
			if (!self.isSliding)
				self.gotoY = Mouse.y;
		}
		
		// Going to where you should
		self.x = self.x*0.75 + self.gotoX*0.25;
		self.y = self.y*0.75 + self.gotoY*0.25;
	};
	
	self.Draw = function(x, y) {
		if (self.num == 0)
			return;
		
		ctx.save();
		ctx.translate(self.x, self.y);
		
		// Rotate if conflicting
		if(self.isConflicting){
			self.frame+=0.07;
			ctx.translate(0,20);
			ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
			ctx.translate(0,-20);
		}
		
		// Dangle if dragged
		if(self.dragged){
			self.dangle += (lastMouseX-Mouse.x)/100;
			ctx.translate(5,0);
			ctx.rotate(-self.dangle);
			ctx.translate(-5,0);
			self.dangleVel += self.dangle*(-0.02);
			self.dangle += self.dangleVel;
			self.dangle *= 0.9;
		}
		
		// Select color if using text
		if (!engine.useImages && !self.isSliding) {		
			if (self.dragged)
				ctx.fillStyle = selectColor;
			else if (!self.inPuzzle)
				ctx.fillStyle = outsideColor;
			else if (self.isHint)
				ctx.fillStyle = hintColor;
			else if (self.isConflicting)
				ctx.fillStyle = conflictColor;
			else
				ctx.fillStyle = normalColor;
			
			if (engine.useLetters) {
				var letter = '';
				switch (self.num) {
				case 1:
					letter = 's';
					break;
				case 2:
					letter = 'u';
					break;
				case 3:
					letter = 'd';
					break;
				case 4:
					letter = 'o';
					break;
				case 5:
					letter = 'd';
					break;
				case 6:
					letter = 'b';
					break;
				case 7:
					letter = 'e';
					break;
				case 8:
					letter = 'r';
					break;
				case 9:
					letter = 'v';
					break;
				}
				ctx.fillText(letter, 0, 0);
			}
			else
				ctx.fillText(self.text, 0, 0);
		}
		
		else {
			var id = "";
			if (!self.inPuzzle)
				id += "meh";
			else if (self.isConflicting)
				id += "sad";
			else
				id += "yay";
			id += self.text;
			self.image = images[id];
			if (!images[id])
				self.image = images["yay" + self.text];
			
			ctx.drawImage(self.image, tileSize/6 - (tileSize-self.width)/2,
					tileSize/6 - (tileSize+fontHeight)/2, tileSize*2/3, tileSize*2/3);
		}
		
		ctx.restore();
	};
}

function Slider(x, y, length, dimension) {
	var self = this;
	
	self.piece = new Piece(dimension+1, false, x, y);
	self.piece.isSliding = true;
	self.x = x;
	self.y = y;
	self.length = length;
	self.percentage = 0;
	self.numHints = 0;
	self.text = self.numHints.toString() + " hints";
	addAsset("yay" + (dimension+1).toString(), "./play/img/yay_pentagon.png");

	self.Update = function(show) {
		self.piece.Update(true);
		if (self.piece.x < self.x)
			self.piece.x = self.x;
		if (self.piece.x > self.x + length)
			self.piece.x = self.x + length;
		var oldPercentage = self.percentage;
		self.percentage = (self.piece.x - self.x) / length;
		if (self.percentage != oldPercentage) {
		self.numHints = Math.round(self.percentage * dimension*dimension);
		if (self.numHints < 0)
			self.numHints = 0;
		if (self.numHints > dimension*dimension)
			self.numHints = dimension*dimension;
		self.text = self.numHints.toString() + " hints";
		}
	};
	
	self.Draw = function() {
		ctx.fillStyle = boldColor;
		ctx.strokeRect(self.x, self.y - tileSize/6, length, tileSize/20);
		ctx.fillText(self.text, self.x - dimension*tileSize * 1/3, self.y);
		self.piece.Draw(self.piece.x, self.piece.y);
	};
}