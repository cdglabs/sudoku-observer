function viewRect(left, top, width, height) {		
	document.getElementById('topRect').style.width = document.body.style.width;
	document.getElementById('topRect').style.height = top.toString() + 'px';
	document.getElementById('topRect').style.left = '0px';
	document.getElementById('topRect').style.top = '0px';
	
	document.getElementById('botRect').style.width = document.body.style.width;
	document.getElementById('botRect').style.height = (parseInt(document.body.style.height) - (top + height)).toString() + 'px';
	document.getElementById('botRect').style.left = '0px';
	document.getElementById('botRect').style.top = (top + height).toString() + 'px';
	
	document.getElementById('leftRect').style.width = left.toString() + 'px';
	document.getElementById('leftRect').style.height = height.toString() + 'px';
	document.getElementById('leftRect').style.left = '0px';
	document.getElementById('leftRect').style.top = top.toString() + 'px';
	
	document.getElementById('rightRect').style.width = (parseInt(document.body.style.width) - (left + width)).toString() + 'px';
	document.getElementById('rightRect').style.height = height.toString() + 'px';
	document.getElementById('rightRect').style.left = (left + width).toString() + 'px';
	document.getElementById('rightRect').style.top = top.toString() + 'px';
}

function transOpacity(level) {
	if (!document.styleSheets) {
		setTimeout(function() { transOpacity(level); }, 1000);
		return;
	}
	var i;
	for (i = 0; i < document.styleSheets.length; i++)
		if (!document.styleSheets[i].cssRules || document.styleSheets[i].cssRules.length < 6)
			continue;
		else
			break;
	if (i != document.styleSheets.length) {
		var ss = document.styleSheets[i];
		ss.cssRules[6].style.opacity = level;
	}
}

var destX;
var destY;
var curDiv = '';
var divMap = {};
var iframes = [];

function transRect(left, top, width, height, willScroll) {
	transOpacity('0.0');
	destX = left - (window.document.documentElement.clientWidth - width) / 2;
	destY = top - (window.document.documentElement.clientHeight - height) / 2;
	if (height > window.document.documentElement.clientHeight)
		destY = top;
	if (destX < 0)
		destX = 0;
	if (destY < 0)
		destY = 0;
	if (willScroll)
		startScroll(destX, destY);
	setTimeout(function() { viewRect(left, top, width, height); }, 500);
	setTimeout(function() { transOpacity('1.0'); }, 1000);
}

function transDiv(name, willScroll) {
	if (inMotion)
		return;
	document.getElementById("images").innerHTML = "";
	transRect(divMap[name].left, divMap[name].top, divMap[name].width, divMap[name].height, willScroll);
	genArrows(name);
	curDiv = name;
}

function registerDiv(name, left, top, width, height, north, east, south, west) {
	var ids = [name, north, east, south, west];
	for (var i = 0; i < 5; i++)
		if (divMap[ids[i]] === undefined)
			divMap[ids[i]] = new Object();
	
	divMap[name].left = left;
	divMap[name].top = top;
	divMap[name].width = width;
	divMap[name].height = height;
	
	divMap[name].arrowL = false;
	divMap[name].arrowD = false;
	divMap[name].arrowU = false;
	divMap[name].arrowR = false;
	
	divMap[name].north = north;
	divMap[name].east = east;
	divMap[name].south = south;
	divMap[name].west = west;
	delete divMap[''];
}

function registerName(name, north, east, south, west) {
	var rect = document.getElementById(name).getBoundingClientRect();
	registerDiv(name, rect.left + window.scrollX, rect.top + window.scrollY, rect.right - rect.left, rect.bottom - rect.top,
			north, east, south, west);
}

function genArrows(name) {
	if (divMap[name] === undefined || divMap[name] == '')
		return;
	var size = 32;
	var margin = 8;
	var clientWidth = window.document.documentElement.clientWidth;
	var clientHeight = window.document.documentElement.clientHeight;
	
	var images = [];
	for (var i = 0; i < 4; i++)
		images[i] = document.createElement("img");
	
	images[0].src = "./img/arrow-left.png";
	images[0].id = "arrowL";
	images[0].style.left = margin.toString() + 'px';
	images[0].style.top = ((clientHeight - size) / 2).toString() + 'px';
	
	images[1].src = "./img/arrow-down.png";
	images[1].id = "arrowD";
	images[1].style.left = ((clientWidth - size) / 2).toString() + 'px';
	images[1].style.top = (clientHeight - size - margin).toString() + 'px';
	
	images[2].src = "./img/arrow-up.png";
	images[2].id = "arrowU";
	images[2].style.left = ((clientWidth - size) / 2).toString() + 'px';
	images[2].style.top = margin.toString() + 'px';
	
	images[3].src = "./img/arrow-right.png";
	images[3].id = "arrowR";
	images[3].style.left = (clientWidth - size - margin).toString() + 'px';
	images[3].style.top = ((clientHeight - size) / 2).toString() + 'px';
	
	var src = document.getElementById("images");
	for (var i = 0; i < 4; i++) {
		images[i].style.width = size.toString() + 'px';
		images[i].style.height = size.toString() + 'px';
		images[i].style.position = 'fixed';
		images[i].attributes.class = "navigator";
		images[i].className = "navigator";
		images[i].name = name;
		switch (i) {
		case 0:
			var idl = divMap[name].west;
			if (!(idl === undefined || idl == '' || divMap[name].arrowL)) {
				images[i].onmousedown = function() {
					transDiv(idl, true);
				};
				src.appendChild(images[i]);
			}
			break;
		case 1:
			var idd = divMap[name].south;
			if (!(idd === undefined || idd == '' || divMap[name].arrowD)) {
				images[i].onmousedown = function() {
					transDiv(idd, true);
				};
				src.appendChild(images[i]);
			}
			break;
		case 2:
			var idu = divMap[name].north;
			if (!(idu === undefined || idu == '' || divMap[name].arrowU)) {

				images[i].onmousedown = function() {
					transDiv(idu, true);
				};
				src.appendChild(images[i]);
			}
			break;
		case 3:
			var idr = divMap[name].east;
			if (!(idr === undefined || idr == '' || divMap[name].arrowR)) {
				images[i].onmousedown = function() {
					transDiv(idr, true);
				};
				src.appendChild(images[i]);
			}
			break;
		}
	}
}

function transNearest(event) {
	for (var div in divMap) {
		if (event.pageX > divMap[div].left && event.pageX < divMap[div].left + divMap[div].width
				&& event.pageY > divMap[div].top && event.pageY < divMap[div].top + divMap[div].height) {
			transDiv(div, true);
			return;
		}
	}
	startScroll(destX, destY);
}

function transKey(event) {
	if (event.keyCode == 37 && document.getElementById('arrowL'))
		document.getElementById('arrowL').onmousedown.call();
	else if (event.keyCode == 38 && document.getElementById('arrowU'))
		document.getElementById('arrowU').onmousedown.call();
	else if (event.keyCode == 39 && document.getElementById('arrowR'))
		document.getElementById('arrowR').onmousedown.call();
	else if (event.keyCode == 40 && document.getElementById('arrowD'))
		document.getElementById('arrowD').onmousedown.call();
}

var magicComplete = false;
var latinComplete = false;
var fourComplete = false;
var tutComplete = false;
var freeComplete = false;
function CheckFrames() {
	if (!freeComplete && iframes[5].contentWindow.IS_COMPLETE) {
		init_complete();
		freeComplete = true;
	}
	else if (!tutComplete && iframes[4].contentWindow.IS_COMPLETE) {
		registerName('tutDiv', 'headerDiv', '', 'freeDiv', '4x4Div');
		registerName('freeDiv', 'tutDiv', '', '', 'magicDiv');
		transDiv('tutDiv', false);
		tutComplete = true;
	}
	else if (!fourComplete && iframes[3].contentWindow.IS_COMPLETE) {
		registerName('4x4Div', 'titleDiv', 'tutDiv', 'latinDiv', '');
		registerName('tutDiv', 'headerDiv', '', '', '4x4Div');
		transDiv('4x4Div', false);
		fourComplete = true;
	}
	else if (!latinComplete && iframes[2].contentWindow.IS_COMPLETE) {
		registerName('latinDiv', '4x4Div', '', '', 'magicDiv');
		registerName('4x4Div', 'titleDiv', '', 'latinDiv', '');
		transDiv('latinDiv', false);
		latinComplete = true;
	}
	else if (!magicComplete && iframes[1].contentWindow.IS_COMPLETE) {
		registerName('magicDiv', 'titleDiv', 'latinDiv', '', '');
		registerName('latinDiv', 'titleDiv', '', '', 'magicDiv');
		transDiv('magicDiv', false);
		magicComplete = true;
	}
	
	var eventFound = false;
	var clientWidth = window.document.documentElement.clientWidth;
	var clientHeight = window.document.documentElement.clientHeight;
	for (var i = 0; i < iframes.length; i++) {
		if (iframes[i] != undefined) {
			if (!eventFound && iframes[i].contentWindow.ARROW_EVENT) {
				transKey(iframes[i].contentWindow.ARROW_EVENT);
				delete iframes[i].contentWindow.ARROW_EVENT;
				eventFound = true;
			}
			var bounds = iframes[i].getBoundingClientRect();
			if (bounds.left > clientWidth || bounds.right < 0
					|| bounds.top > clientHeight || bounds.bottom < 0)
				iframes[i].contentWindow.IS_IN_SIGHT = false;
			else
				iframes[i].contentWindow.IS_IN_SIGHT = true;
		}
	}
	
	var best = 0;
	var threshhold = 0;
	var bestDiv = '';
	if (!inMotion) {
		for (var name in divMap) {
			var div = divMap[name];
			var left = div.left - window.scrollX;
			var top = div.top - window.scrollY;
			if (left < clientWidth && left + divMap[name].width > 0 && top < clientHeight && top + divMap[name].height > 0) {
				var intersect = (Math.min(left + divMap[name].width, clientWidth) - Math.max(left, 0))
					* (Math.min(top + divMap[name].height, clientHeight) - Math.max(top, 0));
				if (intersect > best) {
					best = intersect;
					bestDiv = name;
				}
				if (name == curDiv)
					threshhold = 2 * intersect;
			}
		}
	}
	if (bestDiv != curDiv && bestDiv != '' && best > threshhold)
		transDiv(bestDiv, false);
	
	var canvas = document.getElementById('canvas');
	var shapeySize = Math.floor(window.document.documentElement.clientHeight / 2);
	if (shapeySize != canvas.width) {
		canvas.style.position = 'fixed';
		canvas.style.left = (window.document.documentElement.clientWidth - shapeySize).toString() + 'px';
		canvas.style.top = shapeySize.toString() + 'px';
		canvas.width = shapeySize;
		canvas.height = shapeySize;
	}
	canvas.text = curDiv;
	
	setTimeout('CheckFrames()', 1000);
}

function init() {
	iframes = [
	           document.getElementById('title'),
               document.getElementById('magic'),
               document.getElementById('latin'),
               document.getElementById('4x4'),
               document.getElementById('tut'),
               document.getElementById('free'),
               document.getElementById('color'),
               document.getElementById('shapes')
               ];
		
	registerName('headerDiv', '', '', 'titleDiv', '');
	registerName('titleDiv', 'headerDiv', '', 'magicDiv', '');
	registerName('magicDiv', 'titleDiv', '', '', '');
	
	transDiv('headerDiv', true);
	CheckFrames();
}

function init_complete() {		
	registerName('headerDiv', '', '', 'titleDiv', '');
	registerName('titleDiv', 'headerDiv', '', '4x4Div', '');
	registerName('magicDiv', 'hardDiv', 'ode', '', 'oddeven');
	registerName('latinDiv', '4x4Div', 'jurors', 'effect', 'algorithm');
	registerName('4x4Div', 'headerDiv', 'clues', 'latinDiv', 'shapeDiv');
	registerName('tutDiv', 'headerDiv', '', 'haiku', 'clues');
	registerName('freeDiv', 'verification', '', '', 'jurors');
	registerName('colorDiv', 'headerDiv', 'shapeDiv', 'hardDiv', 'difficult');
	registerName('shapeDiv', 'headerDiv', '4x4Div', 'algorithm', 'colorDiv');
	registerName('hardDiv', 'colorDiv', 'algorithm', 'magicDiv', 'difficult');
	
	registerName('jurors', 'clues', 'haiku', '', 'latinDiv');
	registerName('difficult', 'headerDiv', 'hardDiv', 'oddeven', '');
	registerName('clues', 'headerDiv', 'tutDiv', 'jurors', '4x4Div');
	registerName('verification', 'haiku' ,'', 'freeDiv', 'jurors');
	registerName('ode', 'algorithm', 'effect', '', 'magicDiv');
	registerName('effect', 'latinDiv', 'quote', '', 'ode');
	registerName('quote', 'latinDiv', 'jurors', '', 'effect');
	registerName('oddeven', 'difficult', 'magicDiv', '', '');
	registerName('haiku', 'tutDiv', '', 'verification', 'jurors');
	registerName('algorithm', 'shapeDiv', 'latinDiv', 'ode', 'hardDiv');
	
	transDiv('freeDiv', false);
}