// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the stuff when you're drawing.

// some variables related to the drawing setting
var tileSize = 200;
var tilesHorizontal = 10;
var tilesVertical = 10;
var grid = null;
var gridSpace = 20;
var gridWidth = 1;
var gridColor = "#B2C3F2";
var cursorInterval = 100;

// painting brush settings
var color = "#000";
var radius = 3;

// drawing contexts for every single goddamned tile
var contexts = {};
var backgroundContext = null;

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

    grid = $("#gridCheck").is(":checked");
	
    // set up the tiles
    for (var tileX = 1; tileX <= tilesHorizontal; tileX++) {
        for (var tileY = 1; tileY <= tilesVertical; tileY++) {
            var tileid = "tile_" + tileX + "_" + tileY;
            $("#tileHolder").append("<canvas id=\"" + tileid + "\"></canvas>");
            var tile = $("#" + tileid);
            tile.attr("width", tileSize);
            tile.attr("height", tileSize);
            tile.css("left", (tileX - 1)*tileSize);
            tile.css("top", (tileY - 1)*tileSize);
            var context = tile.get(0).getContext("2d");
            context.lineJoin = "round";
            contexts[tileid] = context;
            tile.mousedown(handler_mousedown);
            tile.mouseup(handler_mouseup);
            tile.mousemove(handler_mousemove);
            tile.contextmenu(event_eater);
            tile.select(event_eater);
        }
    }

    // initialize the background
    $("#backgrounder").attr("width", tilesHorizontal * tileSize);
    $("#backgrounder").attr("height", tilesVertical * tileSize);
    backgroundContext = $("#backgrounder").get(0).getContext("2d");
    clearCanvas();

    // bring it on
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
    backgroundContext.beginPath();
    backgroundContext.lineJoin = "round";
    backgroundContext.moveTo(ax, ay);
    backgroundContext.lineTo(bx, by);
    backgroundContext.closePath();
    backgroundContext.strokeStyle = gridColor;
    backgroundContext.lineWidth = gridWidth;
    backgroundContext.stroke();
}

// this fills the canvas with white, and also does a grid if the user wants
function clearCanvas() {
    for (var index in contexts) {
        if (!contexts.hasOwnProperty(index)) continue;
        var context = contexts[index];
        context.clearRect(0, 0, tileSize, tileSize);
        if (grid) {
            var dim = Math.max(tilesHorizontal, tilesVertical) * tileSize;
            for (var k = 0; k <= dim; k += gridSpace) {
                gridLine(k, 0, k, dim);
                gridLine(0, k, dim, k);
            }
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
function handler_mousedown(event) {
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
};

// event handler: the mouse button has been released.
function handler_mouseup(e) {
    action = "none";
};

// store the last position of the cursor
var lastx = null;
var lasty = null;
var lastrx = null;
var lastry = null;

// store the prevous position of the cursor
// necessary for that check to prevent cyclic moving caused by the scroll calls
// triggering the mousemove event, which is really stupid, but can't be fought.
var oldx = null;
var oldy = null;
var oldrx = null;
var oldry = null;

// keep track of the last tile we were on
var last_tile = null;

// event handler: the mouse has moved.
function handler_mousemove(e) {
    var tileid = e.target.id;
    var tile = $("#" + tileid);
    var xpos = e.pageX;
    var ypos = e.pageY;
    // work out where in the tile the event happened
    var offset = tile.offset();
    var relativeX = xpos - offset.left;
    var relativeY = ypos - offset.top;
    if (action == "drag") {
        // right click means we're dragging
		if (xpos == lastx && ypos == lasty) return false;
		if (xpos == oldx && ypos == oldy) return false;
		var sctop = $("body").scrollTop();
		var scleft = $("body").scrollLeft();
		$("body").scrollTop(sctop + lasty - ypos);
		$("body").scrollLeft(scleft + lastx - xpos);
    } else if (action == "paint") {
        // left click means paint
        var paint_info = {
            "tile_before": last_tile,
            "tile_after": tileid,
			"ax": lastrx,
			"ay": lastry,
			"bx": relativeX,
			"by": relativeY,
			"color": color,
			"radius": radius
		}
		strokePaint(paint_info);
		socket.emit("paint", paint_info);
    }
    // keeping track of the old absolute positions
    oldx = lastx;
    oldy = lasty;
    lastx = xpos;
    lasty = ypos;
    // keeping track of the old relative positions
	oldrx = lastrx;
	oldry = lastry;
	lastrx = relativeX;
    lastry = relativeY;
    // keeping track of the tile
    last_tile = tileid;
	e.stopPropagation();
}

// event handler: pretend it never happened
function event_eater(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

// make cursors delegate mouse events to the canvas

// called to stroke paint actions by users
function strokePaint(obj) {
	if (obj["radius"] > max_radius) return false;
    var tile_before = $("#" + obj["tile_before"]);
    var tile_after = $("#" + obj["tile_after"]);
    // both events happened on the same tile, thank god this gon' be easy
    if (obj["tile_before"] == obj["tile_after"]) {
        var context = contexts[obj["tile_after"]];
        context.beginPath();
        if (!(obj["ax"] == obj["bx"] && obj["ay"] == obj["by"])) {
            context.strokeStyle = obj["color"];
            context.lineWidth = obj["radius"];
            context.moveTo(obj["ax"], obj["ay"]);
            context.lineTo(obj["bx"], obj["by"]);
            context.closePath();
            context.stroke();
        }
    } else {
        // drawing events happened on different tiles, oh god
        // this gonna be complicated, we have to join the lines so we don't
        // get weirdly cut lines when painting near a tile boundary
        
        // first, get some aspects of the tiles
        var tile_before_x = obj["tile_before"].split("_")[1];
        var tile_before_y = obj["tile_before"].split("_")[2];
        var tile_after_x = obj["tile_after"].split("_")[1];
        var tile_after_y = obj["tile_after"].split("_")[2];

        // first off: do the first line, that goes "outside" the first tile
        var context_before = contexts[obj["tile_before"]];
        context_before.lineWidth = obj["radius"];
        context_before.strokeStyle = obj["color"];

        // define the theoretical "point" where the end of the line would be
        // located if it was in the first tile
        var before_theoretical_bx = obj["bx"] + (tile_after_x - tile_before_x)
            * tileSize;
        var before_theoretical_by = obj["by"] + (tile_after_y - tile_before_y)
            * tileSize;
        // draw the line
        context_before.beginPath();
        context_before.moveTo(obj["ax"], obj["ay"]);
        context_before.lineTo(before_theoretical_bx, before_theoretical_by);
        context_before.closePath();
        context_before.stroke();
        
        // rinse and repeat, for the other tile
        var context_after = contexts[obj["tile_after"]];
        context_after.lineWidth = obj["radius"];
        context_after.strokeStyle = obj["color"];
        var after_theoretical_ax = obj["ax"] + (tile_before_x - tile_after_x)
            * tileSize;
        var after_theoretical_ay = obj["ay"] + (tile_before_y - tile_after_y)
            * tileSize;
        context_after.beginPath();
        context_after.moveTo(obj["bx"], obj["by"]);
        context_after.lineTo(after_theoretical_ax, after_theoretical_ay);
        context_after.closePath();
        context_after.stroke();
    }

    if (obj["user"]) {
    // it ain't us, so let's move their cursor too
        var absoluteX = tile_after.offset().left + obj["bx"];
        var absoluteY = tile_after.offset().top + obj["by"];
        setCursor({
            "x": absoluteX,
            "y": absoluteY,
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

// used to delegate events to the tiles, makes cursor elements not interfere
// with the drawing but still show "in front" of them
function delegator(ev) { 
    var tile_x = Math.ceil(ev.pageX / tileSize);
    var tile_y = Math.ceil(ev.pageY / tileSize);
    var tile = $("#tile_" + tile_x + "_" + tile_y);
    ev.target = tile.get(0);
    tile.trigger(ev);
}

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
    cursor.contextmenu(event_eater);
    cursor.select(event_eater)
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
