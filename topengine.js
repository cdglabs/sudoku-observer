var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.font = "lighter 20px Nunito";
var fontHeight = 15;
var normalColor = "#0000FF";
var conflictColor = "#FF0000";
var hintColor = "#404040";
var selectColor = "#FF8000";
var outsideColor = "#0000FF";
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
ctx.fillStyle = normalColor;

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
addAsset("mirrorbubble", "./img/mirror-bubble.png");

var clicked = false;
var clickLock = false;
var lastMouseX = 0;
var lastMouseY = 0;
var engine;
function Piece(x, y) {
	var self = this;
	
	self.text = "";
	self.x = x;
	self.y = y;
	self.gotoX = x;
	self.gotoY = y;
	self.dragged = false;
	self.frame = 0;
	self.dangle = 0;
	self.dangleVel = 0;
	self.bubble = true;
	self.visible = 0;
	self.rotate = false;
	self.size = self.bubble ? canvas.width / 5 : canvas.width / 10;
	
	self.Update = function() {
		self.size = self.bubble ? canvas.width / 5 : canvas.width / 10;
		if (self.bubble && self.visible > 0)
			self.visible--;
		
		if (clicked && !self.bubble) {
			if (!self.dragged) {
				self.dragged = true;
				clicked = false;
			}
			
			else {
				self.dragged = false;
				clicked = false;
			}
		}
		
		// Follow the mouse
		if (self.dragged) {
			self.gotoX = Mouse.x - window.scrollX;
			self.gotoY = Mouse.y - window.scrollY;
		}
		
		if (self.gotoX < 0)
			self.gotoX = 0;
		if (self.gotoX > canvas.width - self.size)
			self.gotoX = canvas.width - self.size;
		if (self.gotoY < 0)
			self.gotoY = 0;
		if (self.gotoY > canvas.height - self.size)
			self.gotoY = canvas.height - self.size;
		
		// Going to where you should
		self.x = self.x*0.75 + self.gotoX*0.25;
		self.y = self.y*0.75 + self.gotoY*0.25;
	};
	
	self.Draw = function() {
		if (self.bubble && !self.rotate)
			self.image = images["speechbubble"];
		else if (self.bubble && self.rotate)
			self.image = images["mirrorbubble"];
		if (!self.bubble || self.visible > 0) {
			if (self.visible > 0)
				ctx.globalAlpha = self.visible / 150;
			ctx.drawImage(self.image, self.x, self.y, self.size, self.size);
			if (self.text != "") {
				var font = ctx.font.split("px");
				ctx.font = Math.floor(self.size / 20).toString() + "px" + font[1];
				ctx.fillText(self.text, self.x + self.size / 8, self.y + self.size / 2);
			}
			ctx.globalAlpha = 1;
		}
	};
}

var foo = new Piece(0, 0);
foo.image = images["yaytriangle"];
foo.bubble = false;
var bar = new Piece(0, 0);
bar.image = images["speechbubble"];
bar.text = "Lorem ipsum dolor sit amet";
window.IS_IN_SIGHT = true;

function render() {
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
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	if (canvas.width != window.innerWidth)
		canvas.width = window.innerWidth;
	if (canvas.height != window.innerHeight)
		canvas.height = window.innerHeight;
	
	foo.Update();
	foo.Draw();
	
	var dx = Mouse.x - window.scrollX - foo.x;
	var dy = Mouse.y - window.scrollY - foo.y;
	if (dx > 0 && dx < foo.size && dy > 0 && dy < foo.size && !foo.dragged)
		bar.visible = 300;
	bar.gotoX = foo.gotoX - bar.size * .4;
	bar.gotoY = foo.gotoY - bar.size * .7;
	if (bar.gotoY < 0) {
		bar.gotoY = foo.gotoY + foo.size * .65;
		bar.gotoX += foo.size * .50;
		bar.rotate = true;
	}
	else
		bar.rotate = false;
	
	bar.Update();
	bar.Draw();
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