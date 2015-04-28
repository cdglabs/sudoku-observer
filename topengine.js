var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var visibleDuration = 60;

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
addAsset("yaytriangle", "./play/img/yay_triangle.png");
addAsset("speechbubble", "./img/speech-bubble.png");

function getMessage(divID) {
	if (divID == "intro")
		return "Hover the mouse over me to see what I have to say!";
	else if (divID == "headerDiv")
		return "Hi! I'm Shapey, and I'm here to guide you through this edition of the Sudoku Observer. " +
				"You can click the arrows on the edge to navigate, or use the arrow keys instead. ";
	else if (divID == "titleDiv")
		return "For today's puzzle, instead of numbers we have all the letters in our newspaper's name! " +
				"If you don't know how to solve Sudoku puzzles, you can continue down for an introduction.";
	else if (divID == "magicDiv")
		return "If you're having trouble, here's a hint: the 5 goes in the center, and the even numbers all go in the corners. " +
				"And in case you were wondering, I am not inspired by Clippy. Not at all.";
	else if (divID == "latinDiv")
		return "I'm a refugee from Parable of the Polygons, where no one ever let us settle down. " +
				"We're treated more humanely here, since we're not just being used as tools to prove some message.";
	else if (divID == "4x4Div")
		return "The Hint button will throw a correct number onto the grid, but try not to use it. " +
				"Sudoku is more rewarding the more thinking you do for yourself!";
	else if (divID == "tutDiv")
		return "Without further ado, here's a tutorial on the basic strategies of Sudoku. " +
				"Parts of the board are greyed out so you can focus on what you need to.";
	else if (divID == "freeDiv")
		return "Congratulations! After you complete a puzzle here you'll gain access to the whole paper. " +
				"Know that you can click on a post to go straight to it, instead of using the arrows.";
	else
		return "This is the " + divID + " post, and that's about all I can tell you. " +
				"I'll get back to you when my creator gets back to me!";
}

var clicked = false;
var clickLock = false;
var lastMouseX = 0;
var lastMouseY = 0;
var MX = 0;
var MY = 0;
var engine;
function Piece(x, y) {
	var self = this;
	
	self.text = "";
	self.x = x;
	self.y = y;
	self.dragged = false;
	self.frame = 0;
	self.dangle = 0;
	self.dangleVel = 0;
	self.bubble = true;
	self.visible = 0;
	
	self.Update = function() {
		self.size = self.bubble ? canvas.width : canvas.width / 2;
		if (self.bubble && self.visible > 0)
			self.visible--;
		
		if (MX > canvas.width / 2 && MX < canvas.width && MY > canvas.height / 2 && MY < canvas.height) {
			if (self.bubble)
				self.visible = visibleDuration;
			else if (clicked && !self.dragged) {
				self.dragged = true;
				clicked = false;
			}
		}
		else if (self.dragged)
			self.dragged = false;
		
	};
	
	self.Draw = function() {
		if (!canvas.draw)
			return false;
		
		ctx.save();
		ctx.translate(self.x, self.y);
		
		if(self.dragged)
			self.frame+=0.07;
		ctx.translate(canvas.width * 3 / 4, canvas.height * 3 / 4);
		ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
		ctx.translate(-canvas.width * 3 / 4, -canvas.height * 3 / 4);
		
		if (self.bubble) {
			self.image = images["speechbubble"];
			self.text = getMessage(canvas.text);
			if (shapey.dragged)
				self.text = "Unhand me!";
		}
		
		if (!self.bubble || self.visible > 0 || canvas.text == "intro") {
			if (self.visible > 0 && canvas.text != "intro")
				ctx.globalAlpha = self.visible / visibleDuration;
			
			if (self.bubble)
				ctx.drawImage(self.image, 0, 0, self.size, self.size * 2 / 3);
			else
				ctx.drawImage(self.image, canvas.width / 2, canvas.height / 2, self.size, self.size);
			
			if (self.text != "") {
				var pointSize = Math.floor(canvas.width / 22.5);
				var hyphen = "";
				ctx.font= pointSize.toString() + "px Domine";
				ctx.fillStyle = "#0000FF";
				var position = 0;
				var line = 0;
				while (position < self.text.length) {
					var lineLength = 40;
					if (position + 40 < self.text.length) {
						while (self.text[position+lineLength] != ' ') {
							lineLength--;
							if (lineLength == 0) {
								lineLength = 40;
								break;
							}
						}
					}
					ctx.fillText(self.text.substring(position, position + lineLength) + hyphen, canvas.width * .1, canvas.height * .15 + line * pointSize);
					position += lineLength + 1;
					line++;
				}
			}
			
			ctx.globalAlpha = 1;
		}
		
		ctx.restore();
	};
}

var shapey = new Piece(0, 0);
shapey.image = images["yaytriangle"];
shapey.bubble = false;
var speech = new Piece(0, 0);
speech.image = images["speechbubble"];
window.IS_IN_SIGHT = true;
canvas.draw = false;

function render() {
	if (assetsLeft)
		return;
	
	lastMouseX = MX;
	lastMouseY = MY;
	MX = Mouse.x - parseInt(canvas.style.left) + canvas.offsetLeft - window.pageXOffset;
	MY = Mouse.y - parseInt(canvas.style.top);
	
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
	
	Mouse.pressed = false;
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	
	shapey.Update();
	shapey.Draw();
	
	speech.Update();
	speech.Draw();
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