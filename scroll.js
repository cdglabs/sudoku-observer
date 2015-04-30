// Static parameters
var startX;
var startY;
var endX;
var endY;
var distX;
var distY;

// Dynamic parameters
var VX;
var VY;
var AX;
var AY;
var RX;
var RY;

// 'Lock' for the scrolling action
var inMotion = false;

function startScroll(x, y) {
	if (inMotion)
		return;
	inMotion = true;
	
	startX = window.scrollX;
	startY = window.scrollY;
	endX = x;
	endY = y;
	// Rein in out-of-bounds coordinates
	if (endX < 0)
		endX = 0;
	if (endX > window.scrollMaxX)
		endX = window.scrollMaxX;
	if (endY < 0)
		endY = 0;
	if (endY > window.scrollMaxY)
		endY = window.scrollMaxY;
	distX = endX - startX;
	distY = endY - startY;
	
	VX = VY = RX = RY = 0;
	// Acceleration is proportional to distance
	if (Math.abs(distX) > Math.abs(distY)) {
		if (distY != 0) {
			AX = distX / distY;
			AY = 1;
		}
		else {
			AX = 1;
			AY = 0;
		}
	}
	else {
		if (distX != 0) {
			AX = 1;
			AY = distY / distX;
		}
		else {
			AX = 0;
			AY = 1;
		}
	}
	// Acceleration should have same sign as distance
	if (distX * AX < 0)
		AX *= -1;
	if (distY * AY < 0)
		AY *= -1;
	// Norm the accelerations; overall acceleration
	// starts at 1 and changes by 1 each invocation
	var length = Math.sqrt(AX * AX + AY * AY);
	AX /= length;
	AY /= length;
	pageScroll();
}

function pageScroll() {
	// You can only scroll by integer amounts; RX and RY hold
	// the decimal parts of VX and VY that are truncated each call
	// and add them back in when they 'overflow' (>= 1)
	RX += VX % 1;
	RY += VY % 1;
	window.scrollBy(VX + Math.floor(RX), VY + Math.floor(RY));
	RX %= 1;
	RY %= 1;
	
	if (AX != 0 || AY != 0) { // AX/AY set to zero when the horizontal/vertical destination is reached
		scrolldelay = setTimeout('pageScroll()', 16); // 60 scrolls/second
		
		if (distX > 0 ? window.scrollX < endX
				: window.scrollX > endX) {	// If you haven't reached the endpoint...
			if (distX > 0 ? window.scrollX - startX < distX / 2
					: window.scrollX - startX > distX / 2)	// If you are not halfway there, accelerate
				VX += AX;
			else											// If you are already halfway there, decelerate
				VX -= AX;
			if (distX * VX < 0 && AX != 0)					// Don't let deceleration reverse direction
				VX = distX > 0 ? 1 : -1;
		}
		else								// If you have reached the endpoint, stop moving
			VX = AX = RX = 0;
		
		if (distY > 0 ? window.scrollY < endY
				: window.scrollY > endY) {
			if (distY > 0 ? window.scrollY - startY < distY / 2
					: window.scrollY - startY > distY / 2)
				VY += AY;
			else
				VY -= AY;
			if ((distY * VY < 0) && AY != 0)
				VY = distY > 0 ? 1 : -1;
		}
		else
			VY = AY = RY = 0;
	}
	
	if (Math.sqrt(VX * VX + VY * VY) < .1)
		inMotion = false;
}