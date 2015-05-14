var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var fadeDuration = 60;
var persistDuration = 180;
var blinkingDuration = 120;
var blinkDuration = 5;
var blurtDuration = 600;
var chokeDuration = 300;
var textColor = "#000000";

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
addAsset("blinktriangle", "./play/img/yay_triangle_blink.png");
addAsset("sadtriangle", "./play/img/sad_triangle.png");
addAsset("speechbubble", "./img/speech-bubble.png");

function getMessage(divID) {
	if (divID == "headerDiv")
		return "Hi! I'm Shapey, and I'm here to guide you through this edition of the Sudoku Observer. " +
				"You can click the arrows on the edge to navigate, or use the arrow keys instead. ";
	else if (divID == "titleDiv")
		return "Like in real life, you don't have to solve the daily puzzle, but if you want to try the rules are to the left. " +
				"Otherwise you can continue down for an introduction to Sudoku.";
	else if (divID == "rulesDiv")
		return "Like in a certain other blog post, I can be dragged around (sort of). " +
				"But you wouldn't do that to a poor homeless shape, would you?";
	else if (divID == "magicDiv")
		return "Here's some hints: the 5 goes in the center, and the sum of the numbers 1-9 is 45. " +
				"And in case you were wondering, I am not inspired by Clippy. Not at all.";
	else if (divID == "latinDiv")
		return "I'm a refugee from Parable of the Polygons, where no one ever let us settle down. " +
				"We're treated more humanely here, since we're not just being used as tools to prove some message.";
	else if (divID == "4x4Div")
		return "The Hint button will throw a correct number onto the grid, but try not to use it. " +
				"Sudoku is more rewarding the more thinking you do for yourself!";
	else if (divID == "tutDiv")
		return "Parts of the board are greyed out so you can focus on what you need to. " +
				"Remember that you can grab pieces using the number keys!";
	else if (divID == "freeDiv")
		return "Congratulations! You now have access to the whole paper. " +
				"Know that you can click on a post to go straight to it, instead of using the arrows.";
	else if (divID == "colorDiv")
		return "This is the color puzzle. Have fun!";
	else if (divID == "shapesDiv")
		return "This is the shapes puzzle. Remember, shapes are people too!";
	else if (divID == "hardDiv")
		return "This is the so-called most difficult puzzle. (Try to) have fun!";
	else
		return "This is the " + divID + " post, and that's about all I can tell you. " +
				"I'll get back to you when my creator gets back to me!";
}

function getBlurt(msgID, curMsg) {
	if (msgID == "introMsg")
		return "Hover the mouse over me to see what I have to say!";
	else if (msgID == "magicDiv")
		return "Navigate right to continue to the next section.";
	else if (msgID == "latinDiv")
		return "Navigate up to continue to the next section.";
	else if (msgID == "4x4Div")
		return "Navigate right to continue to the next section.";
	else if (msgID == "tutDiv")
		return "Nagivate down to continue to the next section.";
	else
		return curMsg;
}

var clicked = false;
var clickLock = false;
var lastMouseX = 0;
var lastMouseY = 0;
var MX = 0;
var MY = 0;
var CX = 0;
var CY = 0;
var mouseChanged = false;
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
	self.blurting = false;
	self.visible = 0;
	self.blinking = 0;
	self.blink = 0;
	self.dying = 0;
	
	self.Update = function() {
		self.size = self.bubble ? canvas.width : canvas.width / 2;
		if (self.visible > 0)
			self.visible--;
		if (self.blinking > 0)
			self.blinking--;
		if (self.blink > 0)
			self.blink--;
		if (self.visible == 0)
			self.blurting = false;
		if (inMotion && !(self.blurting && self.text == "Hover the mouse over me to see what I have to say!"))
			self.visible = 0;
		if (!self.dragged)
			self.dying = 0;
		
		var inShapey = MX > canvas.width / 2 && MY > canvas.height / 2;
		var inBubble = MX > 0 && MY > 0 && MY < canvas.height / 2;
		
		if (self.bubble && canvas.blurt) {
			self.visible = blurtDuration;
			self.blurting = true;
			canvas.blurt = false;
		}
		else if (mouseChanged && ((!self.visible && inShapey)
				|| (self.visible && (inShapey || inBubble)))) {
			if (self.bubble) {
 				self.visible = persistDuration + fadeDuration;
 				self.blurting = false;
			}
		}

		if (!self.bubble && inShapey && clicked) {
			clicked = false;
			self.dragged = !self.dragged;
			CX = MX;
			CY = MY;
		}
		
		if (canvas.setBlinking && !self.bubble) {
			canvas.setBlinking = false;
			self.blinking = blinkingDuration;
		}
	};
	
	self.Draw = function() {
		if (!canvas.draw || (self.bubble && inMotion && !self.blurting))
			return;
		
		ctx.save();
		ctx.translate(self.x, self.y);
		
		if(self.dragged)
			self.frame+=0.07;
		ctx.translate(canvas.width * 3 / 4, canvas.height * 3 / 4);
		ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
		ctx.translate(-canvas.width * 3 / 4, -canvas.height * 3 / 4);
		
		if (self.bubble) {
			self.image = images["speechbubble"];
			self.text = self.blurting ? getBlurt(canvas.text, self.text) : getMessage(canvas.text);
			if (shapey.dying)
				self.text = "If you keep me here for a few more seconds I'll be gone...please, I have nowhere else to go :(";
			else if (shapey.dragged)
				self.text = "Unhand me! Don't try to get rid of me by forcing me into the corner!";
		}
		else {
			if (self.blinking && Math.random() < .1)
				self.blink = blinkDuration;
			if (speech.visible > (persistDuration + fadeDuration) * .9 && !speech.blurting)
				self.image = images["blinktriangle"];
			else
				self.image = images["yaytriangle"];
			self.image = self.blink ? images["blinktriangle"] : self.image;
			self.image = self.dragged ? images["sadtriangle"] : self.image;
		}
		
		if (!self.bubble || self.visible > 0 || self.blurting) {
			if (self.visible > 0 && !self.blurting)
				ctx.globalAlpha = self.visible / fadeDuration;
			
			if (self.bubble)
				ctx.drawImage(self.image, 0, 0, self.size, self.size * 2 / 3);
			else if (!self.dragged)
				ctx.drawImage(self.image, canvas.width / 2, canvas.height / 2, self.size, self.size);
			else {
				var OX = MX - CX;
				var OY = MY - CY;
				OX = OX > 0 ? OX : 0;
				OY = OY > 0 ? OY : 0;
				if (MX > canvas.width * 3/4 && MY > canvas.height * 3/4)
					self.dying++;
				else
					self.dying = 0;
				ctx.globalAlpha = (chokeDuration - self.dying) / chokeDuration;
				ctx.drawImage(self.image, canvas.width / 2 + OX, canvas.height / 2 + OY, self.size, self.size);
				if (self.dying == chokeDuration) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					canvas.draw = false;
					window.IS_IN_SIGHT = false;
				}
			}
			
			if (self.text != "") {
				var pointSize = Math.floor(canvas.width / 22.5);
				var hyphen = "";
				ctx.font= pointSize.toString() + "px Carrois Gothic";
				ctx.fillStyle = textColor;
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
canvas.blurt = false;

function render() {
	if (assetsLeft)
		return;
	
	mouseChanged = lastMouseX != MX || lastMouseY != MY;
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