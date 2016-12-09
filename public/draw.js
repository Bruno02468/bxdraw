// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the stuff when you're drawing.

// some variables related to the drawing setting
var canvasWidth = 1920;
var canvasHeight = 1080;
var grid = true;
var gridSpace = 20;
var gridWidth = 1;
var gridColor = "#B2C3F2";
var cursorInterval = 100;

// painting brush settings
var color = "#000";
var radius = 3;

// to be set only after the canvas is created
var canvas, context;

// some limits ought to be set, aye
var max_radius = 20;

// we're ready to go, create the components 'n stuff
function getDrawing() {
	// hide the gate
	$("#gate").hide();
	$("#roominfo").append("\"" + room + "\"");

	// initialize radius input stuff
	$("#radius").val(3);
	$("#radiuscanvas").attr("width", 2*max_radius + 10);
	$("#radiuscanvas").attr("height", 2*max_radius + 10);
	$("#radius").attr("max", max_radius);
	
	// set up the canvas and move the user to the center
	canvas = $("#canvas");
    canvas.attr("width", canvasWidth);
    canvas.attr("height", canvasHeight);
    context = canvas.get(0).getContext("2d");
    clearCanvas();
    $("#draw").fadeIn();
	$("body").css("overflow", "hidden");
    updateRadius();

    // begin sending cursor
    setInterval(sendCursor, cursorInterval);
}

// move the user back to the center of the drawing pad
// deprecated/unused because it's absolutely useless lol
function goToCenter() {
    $("body").animate({
        "scrollTop": canvasHeight/2 - $(window).height(),
        "scrollLeft": canvasWidth/2 - $(window).width()
    }, 1000);
}

// used to make up grid lines
function gridLine(ax, ay, bx, by) {
    context.beginPath();
    context.lineJoin = "round";
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.strokeStyle = gridColor;
    context.lineWidth = gridWidth;
    context.stroke();
}

// this fills the canvas with white, and also does a grid if the user wants
function clearCanvas() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    if (grid) {
        var dim = Math.max(canvasWidth, canvasHeight);
        for (var k = 0; k <= dim; k += gridSpace) {
            gridLine(k, 0, k, dim);
            gridLine(0, k, dim, k);
        }
    }
}

// called when the user picks a new color from the picker
function updateColor() {
	color = $("#picker").val();
}

// called to redraw the radius thing and set the radius
function updateRadius() {
	radius = $("#radius").val();
	var ctx = $("#radiuscanvas").get(0).getContext("2d");
	var dimension = $("#radiuscanvas").width();
	ctx.clearRect(0, 0, dimension, dimension)
	ctx.beginPath();
	var center = Math.floor(dimension/2);
	ctx.arc(center, center, radius, 0, 2*Math.PI);
	ctx.closePath();
	ctx.strokeStyle = color;
	ctx.fill();
}

// holds the current user mouse action
var action = "none";

// event handler: the user pressed a mouse button.
$("#canvas").mousedown(function(event) {
    switch (event.which) {
		case 1:
			action = "paint";
            break;
        default:
			action = "drag";
			break;
    }
	event.preventDefault();
	return false;
});

// event handler: the mouse button has been released.
$("#canvas").mouseup(function (e) {
    action = "none";
});

// store the last position of the cursor
var lastx = null;
var lasty = null;

// store the prevous position of the cursor
// necessary for that check to prevent cyclic moving caused by the scroll calls
// triggering the mousemove event, which is really stupid, but can't be fought.
var oldx = null;
var oldy = null;

// event handler: the mouse has moved.
$("#canvas").mousemove(function (e) {
	var xpos = e.pageX;
	var ypos = e.pageY;
	if (action == "drag") {
		if (xpos == lastx && ypos == lasty) return false;
		if (xpos == oldx && ypos == oldy) return false;
		var sctop = $("body").scrollTop();
		var scleft = $("body").scrollLeft();
		$("body").scrollTop(sctop + lasty - ypos);
		$("body").scrollLeft(scleft + lastx - xpos);
	} else if (action == "paint") {
		var paint_info = {
			"ax": lastx,
			"ay": lasty,
			"bx": xpos,
			"by": ypos,
			"color": color,
			"radius": radius,
		}
		strokePaint(paint_info);
		socket.emit("paint", paint_info);
	}
	oldx = lastx;
	oldy = lasty;
	lastx = xpos;
	lasty = ypos;
	e.stopPropagation();
});

// event handler: trap the context menu.
$("#canvas").contextmenu(function (e) {
	e.preventDefault();
	return false;
});

// make cursors delegate mouse events to the canvas

// called to stroke paint actions by users
function strokePaint(obj) {
	if (obj["radius"] > max_radius) return false;
	context.beginPath();
	context.lineJoin = "round";
	context.beginPath();
	if (!(obj["ax"] == obj["bx"] && obj["ay"] == obj["by"])) {
		context.strokeStyle = obj["color"];
		context.lineWidth = obj["radius"];
		context.moveTo(obj["ax"], obj["ay"]);
		context.lineTo(obj["bx"], obj["by"]);
		context.closePath();
		context.stroke();
    }
    // it ain't us, so let's move their cursor too
    if (obj["user"]) {
        setCursor({
            "x": obj["bx"],
            "y": obj["by"],
            "user": obj["user"]
        }, true);
    }
}

// someone else drew something
socket.on("paint", function(data) {
	strokePaint(data);
});

// store the last sent positions so you don't send the same position, saves
// everyone's bandwidth, yay!
var lastSentX, lastSentY;

// send the cursor information
function sendCursor() {
    if (lastx == lastSentX && lasty == lastSentY) return false;
    if (action !== "none") return false;
    socket.emit("cursor", {
        "x": lastx,
        "y": lasty
    });
    lastSentX = lastx;
    lastSentY = lasty;
}

// used to delegate events to the canvas
function delegator(ev) { $("#canvas").trigger(ev); }

// create cursor element for new user
function addCursor(user) {
    // add the element the good ol' way
    $("#cursorsWrapper").append("<div class=\"cursor\" id=\"cursor_" + user 
        + "\"><div class=\"cursor-img glyphicon glyphicon-pencil\"></div>"
        + "<div class=\"cursor-text\">" + user + "</div>");
    // save us some typing
    var cursor = $("#cursor_" + user);
    cursor.mousedown(delegator);
    cursor.mouseup(delegator);
    cursor.mousemove(delegator);
    cursor.contextmenu(delegator);
    cursor.blur(function(e) { 
        e.preventDefault();
        e.stopPropagation();
    });
}

// create/move a cursor element to their rightful place
function setCursor(data, instant) {
    var user = data["user"];
    var cursor = $("#cursor_" + user);
    if (!cursor.length) addCursor(user);
    var xpos = data["x"] - 2;
    var ypos = data["y"] + 2;
    if (instant) {
        // came from a draw function, so delay is not necessary
        cursor.css("top", ypos);
        cursor.css("left", xpos);
    } else {
        // came from the periodic sendCursor, so animation makes it
        // smooth and pleasing to the eyes
        cursor.animate({
            "top": ypos,
            "left": xpos
        }, cursorInterval - 50);
    }
}

// listen for cursor events, and feed them into the function above
socket.on("cursor", setCursor);

// delete someone's cursor element
function removeCursor(data) {
    var user = data["username"];
    $("#cursor_" + user).remove();
}

// user left our room, delete their cursor element to save memory
socket.on("left", removeCursor);
