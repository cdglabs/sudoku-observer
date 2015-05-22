/* Gray rectangles that box in the focused element; initialized on page load.
---------------------------------------
|									  |
|				  top			      |
|									  |
---------------------------------------
|			|				|		  |
|	left	|	element		|	right |
|			|				|		  |
---------------------------------------
|									  |
|				bottom			  	  |
|									  |
---------------------------------------
 */
var topRect, botRect, leftRect, rightRect;
var blurRule; // CSS rule for the above rectangles

// Manipulates the rectangles so that they box in the element whose upper-left
// corner is at (left, top) and has dimensions width x height.
function viewRect(left, top, width, height) {
	topRect.style.width = document.body.style.width;
	topRect.style.height = top.toString() + 'px';
	topRect.style.left = '0px';
	topRect.style.top = '0px';
	
	botRect.style.width = document.body.style.width;
	botRect.style.height = (parseInt(document.body.style.height) - (top + height)).toString() + 'px';
	botRect.style.left = '0px';
	botRect.style.top = (top + height).toString() + 'px';
	
	leftRect.style.width = left.toString() + 'px';
	leftRect.style.height = height.toString() + 'px';
	leftRect.style.left = '0px';
	leftRect.style.top = top.toString() + 'px';
	
	rightRect.style.width = (parseInt(document.body.style.width) - (left + width)).toString() + 'px';
	rightRect.style.height = height.toString() + 'px';
	rightRect.style.left = (left + width).toString() + 'px';
	rightRect.style.top = top.toString() + 'px';
}

// Switches the visibility of the gray rectangles (transition effect)
function toggleOpacity(visible) {
	if (blurRule) {
		blurRule.style.opacity = visible ? "1" : "0";
		return;
	}
	
	// Find and save the blur rule
	if (document.styleSheets)
		for (var i = 0; i < document.styleSheets.length; i++)
			try {
				if (document.styleSheets[i].cssRules)
					for (var j = 0; j < document.styleSheets[i].cssRules.length; j++)
						if (document.styleSheets[i].cssRules[j].selectorText == '.blur') {
							blurRule = document.styleSheets[i].cssRules[j];
							toggleOpacity(visible);
						}
			} catch(e) {
				if (e.name != 'SecurityError')
					throw e;
				continue;
			}
			
	if (!blurRule)
		setTimeout(function() { toggleOpacity(visible); }, 1000);
}

var destX;
var destY;
var curDiv = '';
var divMap = {};
var iframes = [];

function transRect(left, top, width, height, willScroll) {
	toggleOpacity(false);
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
	setTimeout(function() { toggleOpacity(true); }, 1000);
}

function transDiv(name, willScroll) {
	if (inMotion)
		return;
	document.getElementById("images").innerHTML = "";
	transRect(divMap[name].left, divMap[name].top, divMap[name].width, divMap[name].height, willScroll);
	genArrows(name);
	for (var i = 0; i < iframes.length; i++)
		if (iframes[i].id + "Div" != name)
			iframes[i].contentWindow.IS_IN_SIGHT = false;
		else
			iframes[i].contentWindow.IS_IN_SIGHT = true;
	curDiv = name;
	divMap[name].visited = true;
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
	
	divMap[name].north = north;
	divMap[name].east = east;
	divMap[name].south = south;
	divMap[name].west = west;
	
	if (!divMap[name].visited)
		divMap[name].visited = false;
	
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
	var size = 48;
	var margin = 8;
	var clientWidth = window.document.documentElement.clientWidth;
	var clientHeight = window.document.documentElement.clientHeight;
	
	var images = [];
	for (var i = 0; i < 4; i++)
		images[i] = document.createElement("img");
	
	images[0].id = "arrowL";
	images[0].style.left = margin.toString() + 'px';
	images[0].style.top = ((clientHeight - size) / 2).toString() + 'px';
	
	images[1].id = "arrowD";
	images[1].style.left = ((clientWidth - size) / 2).toString() + 'px';
	images[1].style.top = (clientHeight - size - margin).toString() + 'px';
	
	images[2].id = "arrowU";
	images[2].style.left = ((clientWidth - size) / 2).toString() + 'px';
	images[2].style.top = margin.toString() + 'px';
	
	images[3].id = "arrowR";
	images[3].style.left = (clientWidth - size - margin).toString() + 'px';
	images[3].style.top = ((clientHeight - size) / 2).toString() + 'px';
	
	var src = document.getElementById("images");
	for (var i = 0; i < 4; i++) {
		var img = images[i];
		img.style.width = size.toString() + 'px';
		img.style.height = size.toString() + 'px';
		img.style.position = 'fixed';
		img.name = name;
		switch (i) {
		case 0:
			var idl = divMap[name].west;
			if (!(idl === undefined || idl == '')) {
				img.onmousedown = function() {
					transDiv(idl, true);
				};
				img.src = divMap[idl].visited ? "./img/arrow-left.png" : "./img/new-left.png";
				img.className = divMap[idl].visited ? "navigator" : "navigator-fresh";
				src.appendChild(img);
			}
			break;
		case 1:
			var idd = divMap[name].south;
			if (!(idd === undefined || idd == '')) {
				img.onmousedown = function() {
					transDiv(idd, true);
				};
				img.src = divMap[idd].visited ? "./img/arrow-down.png" : "./img/new-down.png";
				img.className = divMap[idd].visited ? "navigator" : "navigator-fresh";
				src.appendChild(img);
			}
			break;
		case 2:
			var idu = divMap[name].north;
			if (!(idu === undefined || idu == '')) {
				img.onmousedown = function() {
					transDiv(idu, true);
				};
				img.src = divMap[idu].visited ? "./img/arrow-up.png" : "./img/new-up.png";
				img.className = divMap[idu].visited ? "navigator" : "navigator-fresh";
				src.appendChild(img);
			}
			break;
		case 3:
			var idr = divMap[name].east;
			if (!(idr === undefined || idr == '')) {
				img.onmousedown = function() {
					transDiv(idr, true);
				};
				img.src = divMap[idr].visited ? "./img/arrow-right.png" : "./img/new-right.png";
				img.className = divMap[idr].visited ? "navigator" : "navigator-fresh";
				src.appendChild(img);
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
var toggle = false;

var loadTime = (new Date()).getTime();
var checkTime = true;

var SX = window.scrollX;
var SY = window.scrollY;

function toggleFull() {
	document.getElementById('toggle').attributes['src'].nodeValue = freeComplete ?
			"./img/toggle-full.png" : "./img/toggle-short.png";
	toggle = true;
}

function CheckFrames() {
	var canvas = document.getElementById('canvas');
	if (freeComplete)
		;
	else if (!freeComplete && curDiv == 'freeDiv' && !inMotion) {
		init_complete(false);
		document.getElementById('toggle').outerHTML = "";
		canvas.blurt = true;
		freeComplete = true;
	}
	else if (!tutComplete && curDiv == 'tutDiv' &&
			iframes[4].contentWindow.IS_COMPLETE && !inMotion) {
		registerName('tutDiv', 'headerDiv', '', 'freeDiv', '4x4Div');
		registerName('freeDiv', 'tutDiv', '', '', 'magicDiv');
		transDiv('tutDiv', false);
		canvas.setBlinking = true;
		canvas.blurt = true;
		tutComplete = true;
	}
	else if (!fourComplete && curDiv == '4x4Div' &&
			iframes[3].contentWindow.IS_COMPLETE && !inMotion) {
		registerName('4x4Div', 'titleDiv', 'tutDiv', 'latinDiv', '');
		registerName('tutDiv', 'headerDiv', '', '', '4x4Div');
		transDiv('4x4Div', false);
		canvas.setBlinking = true;
		canvas.blurt = true;
		fourComplete = true;
	}
	else if (!latinComplete && curDiv == 'latinDiv' &&
			iframes[2].contentWindow.IS_COMPLETE && !inMotion) {
		registerName('latinDiv', '4x4Div', '', '', 'magicDiv');
		registerName('4x4Div', 'titleDiv', '', 'latinDiv', '');
		transDiv('latinDiv', false);
		canvas.setBlinking = true;
		canvas.blurt = true;
		latinComplete = true;
	}
	else if (!magicComplete && curDiv == 'magicDiv' &&
			iframes[1].contentWindow.IS_COMPLETE && !inMotion) {
		registerName('magicDiv', 'titleDiv', 'latinDiv', '', '');
		registerName('latinDiv', 'titleDiv', '', '', 'magicDiv');
		transDiv('magicDiv', false);
		canvas.setBlinking = true;
		canvas.blurt = true;
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
		}
	}
	if (!freeComplete && toggle) {
		init_complete(true);
		canvas.blurt = true;
		freeComplete = true;
		toggle = false;
	}
	else if (toggle) {
		divMap = {};
		
		registerName('headerDiv', '', 'attributions', 'titleDiv', '');
		registerName('titleDiv', 'headerDiv', '', 'magicDiv', 'rulesDiv');
		registerName('rulesDiv', 'headerDiv', 'titleDiv', 'magicDiv', '');
		registerName('magicDiv', 'titleDiv', '', '', '');
		registerName('attributions', '', '', '', 'headerDiv');
		
		if (magicComplete) {
			registerName('magicDiv', 'titleDiv', 'latinDiv', '', '');
			registerName('latinDiv', 'titleDiv', '', '', 'magicDiv');
		}
		if (latinComplete) {
			registerName('latinDiv', '4x4Div', '', '', 'magicDiv');
			registerName('4x4Div', 'titleDiv', '', 'latinDiv', '');
		}
		if (fourComplete) {
			registerName('4x4Div', 'titleDiv', 'tutDiv', 'latinDiv', '');
			registerName('tutDiv', 'headerDiv', '', '', '4x4Div');
		}
		if (tutComplete) {
			registerName('tutDiv', 'headerDiv', '', 'freeDiv', '4x4Div');
			registerName('freeDiv', 'tutDiv', '', '', 'magicDiv');
		}
		
		transDiv('headerDiv', true);
		freeComplete = false;
		toggle = false;
	}
	
	var best = 0;
	var threshhold = 0;
	var bestDiv = '';
	if (!inMotion && (SX != window.scrollX || SY != window.scrollY)) {
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
	if (curDiv != bestDiv && curDiv != 'creation' && curDiv != 'garfield' && curDiv != 'geometry'
		&& curDiv != 'quote' && bestDiv != '' && best > threshhold)
		transDiv(bestDiv, false);
	
	var shapeySize = Math.floor(window.document.documentElement.clientHeight / 2);
	if (shapeySize != canvas.width) {
		canvas.style.position = 'fixed';
		canvas.style.left = (window.document.documentElement.clientWidth - shapeySize).toString() + 'px';
		canvas.style.top = shapeySize.toString() + 'px';
		canvas.width = shapeySize;
		canvas.height = shapeySize;
		transDiv(curDiv, false);
	}
	canvas.text = curDiv;
	if (checkTime && ((new Date()).getTime() - loadTime) / 1000 < 15) {
		canvas.text = "introMsg";
		canvas.blurt = true;
		checkTime = false;
	}
	canvas.inMotion = inMotion;
	canvas.draw = true;
	
	SX = window.scrollX;
	SY = window.scrollY;
	
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
               document.getElementById('shapes'),
               document.getElementById('hard'),
               document.getElementById('rules')
               ];
	
	topRect = document.getElementById('topRect');
	botRect = document.getElementById('botRect');
	leftRect = document.getElementById('leftRect');
	rightRect = document.getElementById('rightRect');
	
	registerName('headerDiv', '', 'attributions', 'titleDiv', '');
	registerName('titleDiv', 'headerDiv', '', 'magicDiv', 'rulesDiv');
	registerName('rulesDiv', 'headerDiv', 'titleDiv', 'magicDiv', '');
	registerName('magicDiv', 'titleDiv', '', '', '');
	registerName('attributions', '', '', '', 'headerDiv');
	
	transDiv('headerDiv', true);
	CheckFrames();
}

function init_complete(skip) {		
	registerName('headerDiv', '', 'attributions', 'titleDiv', '');
	registerName('titleDiv', 'headerDiv', 'garfield', '4x4Div', 'rulesDiv');
	registerName('rulesDiv', 'headerDiv', 'titleDiv', 'colorDiv', '');
	registerName('magicDiv', 'hardDiv', 'ode', '', 'oddeven');
	registerName('latinDiv', '4x4Div', 'jurors', 'effect', 'algorithm');
	registerName('4x4Div', 'headerDiv', 'clues', 'latinDiv', 'shapesDiv');
	registerName('tutDiv', 'garfield', 'attributions', 'haiku', 'clues');
	registerName('freeDiv', 'verification', 'attributions', '', 'jurors');
	registerName('colorDiv', 'rulesDiv', 'shapesDiv', 'hardDiv', 'creation');
	registerName('shapesDiv', 'rulesDiv', '4x4Div', 'algorithm', 'colorDiv');
	registerName('hardDiv', 'creation', 'algorithm', 'magicDiv', 'difficult');
	
	registerName('jurors', 'clues', 'haiku', '', 'latinDiv');
	registerName('difficult', 'headerDiv', 'hardDiv', 'oddeven', '');
	registerName('clues', 'garfield', 'tutDiv', 'jurors', '4x4Div');
	registerName('verification', 'haiku' ,'attributions', 'freeDiv', 'jurors');
	registerName('ode', 'algorithm', 'effect', '', 'magicDiv');
	registerName('effect', 'latinDiv', 'geometry', '', 'ode');
	registerName('quote', 'geometry', 'jurors', '', 'effect');
	registerName('oddeven', 'difficult', 'magicDiv', '', '');
	registerName('haiku', 'tutDiv', 'attributions', 'verification', 'jurors');
	registerName('algorithm', 'shapesDiv', 'latinDiv', 'ode', 'hardDiv');
	registerName('attributions', '', '', '', 'headerDiv');
	
	registerName('creation', 'headerDiv', 'colorDiv', 'hardDiv', 'difficult');
	registerName('garfield', 'headerDiv', 'attributions', 'clues', 'titleDiv');
	registerName('geometry', 'latinDiv', 'jurors', 'quote', 'effect');
	
	transDiv(skip ? 'headerDiv' : 'freeDiv', true);
}