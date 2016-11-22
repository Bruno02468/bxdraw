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
	//$("body").css("overflow", "hidden");
	goToCenter();
	updateRadius();
}

// move the user back to the center of the drawing pad
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
	console.log(action);
	event.preventDefault();
	return false;
});

// event handler: the mouse left the canvas.
$("#canvas").mouseleave(function (e) {
    action = "none";
	console.log(action);
});

// event handler: the mouse button has been released.
$("#canvas").mouseup(function (e) {
    action = "none";
	console.log(action);
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

// called to stroke paint actions by users
function strokePaint(obj) {
	if (obj["radius"] > max_radius) return false;
	context.beginPath();
	context.lineJoin = "round";
	context.beginPath();
	// single click paint, a line won't do; do a circle instead
	if (!(obj["ax"] == obj["bx"] && obj["ay"] == obj["by"])) {
		context.strokeStyle = obj["color"];
		context.lineWidth = obj["radius"];
		context.moveTo(obj["ax"], obj["ay"]);
		context.lineTo(obj["bx"], obj["by"]);
		context.closePath();
		context.stroke();
	}
}

// someone else drew something
socket.on("paint", function(data) {
	strokePaint(data);
});
