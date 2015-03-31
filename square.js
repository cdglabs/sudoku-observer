var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var squareColor = "#CCCCCC";
var highlightColor = "#800000";
var receivedColor = "#008000";
var lockColor = "#101010";

function Square(region, piece, x, y) {
	var self = this;
	
	self.region = region;
	self.piece = piece;
	self.hasHint = false;
	self.hintNum = -1;
	self.x = x;
	self.y = y;
	
	self.Draw = function(x, y, show, fade, highlight) {
		// Draw self
		if (self.piece.num != self.hintNum)
			self.hasHint = false;
		if (self.piece.isHint)
			ctx.fillStyle = lockColor;
		else if (highlight && show)
			ctx.fillStyle = highlightColor;
		else if (self.hasHint) // i.e. the hint is given by a GetHint/Solve call
			ctx.fillStyle = receivedColor;
		else
			ctx.fillStyle = squareColor;
		ctx.globalAlpha = .33;
		ctx.fillRect(self.x + 3/40*tileSize, self.y + 3/40*tileSize, tileSize*9/10, tileSize*9/10);
		ctx.globalAlpha = 1;
		
		// Draw piece
		self.piece.Update(show);
		if (!self.piece.dragged) {
			self.piece.gotoX = self.x + (tileSize-self.piece.width)/2;
			self.piece.gotoY = self.y + (tileSize+fontHeight)/2;
			self.piece.Draw(self.piece.x, self.piece.y);
		}
		
		// Fading
		if (show && fade < 75) // Fade out
			ctx.globalAlpha = fade / 100;
		else if (show && fade >= 75) // Fade in
			ctx.globalAlpha = (150 - fade) / 100;
		else
			ctx.globalAlpha = .75;
		
		if (ctx.globalAlpha != 0) {
			ctx.fillStyle = highlight && show ? highlightColor : squareColor;
			ctx.fillRect(self.x + tileSize/10, self.y + tileSize/20, tileSize*9/10, tileSize*9/10);
		}
		ctx.globalAlpha = 1;

	};
};

function PieceContainer(x, y) {
	var self = this;
	
	self.x = x;
	self.y = y;
	self.stock = [];
	
	self.Draw = function(x, y) {
		for (var i = 0; i < self.stock.length; i++) {
			var piece = self.stock[i];
			piece.Update(true);
			if (!piece.dragged) {
				piece.gotoX = self.x + (tileSize-piece.width)/2;
				piece.gotoY = self.y + (tileSize+fontHeight)/2;
				piece.Draw(piece.x, piece.y);
			}
		}
	};
};

function SumBox(x, y) {
	var self = this;
	self.x = x;
	self.y = y;
	self.num = 0;
	self.text = self.num.toString();
	
	self.Draw = function(magicSum) {
		if (self.num == magicSum) {
			ctx.fillStyle = receivedColor;
			ctx.globalAlpha = .33;
			ctx.fillRect(self.x + 3/40*tileSize, self.y + 3/40*tileSize, tileSize*9/10, tileSize*9/10);
			ctx.globalAlpha = 1;
		}

		ctx.fillStyle = hintColor;
		if (self.num != 0)
			ctx.fillText(self.text, self.x + (tileSize-ctx.measureText(self.text).width)/2,
					self.y + (tileSize+fontHeight)/2);
	};
}