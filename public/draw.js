// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the stuff when you're drawing.

// some constants
var tileSize = 3000;
var tilesHorizontal = 1;
var tilesVertical = 1;
var minimap_scale = 1/20;
var grid = null;
var black = null;
var gridSpace = 20;
var gridWidth = 1;
var gridColor = "#B2C3F2";
var darkColor = "#121212";
var cursorInterval = 100;
var thumbnailUpdateInterval = 3000;

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
    black = $("#blackCheck").is(":checked");

    if (black) {
        $("#picker").val("#FFFFFF");
        updateColor();
    }

    // set up the minimap
    var minimap = $("#minimap");
    var dims = {
        "width": tilesHorizontal*tileSize*minimap_scale,
        "height": tilesVertical*tileSize*minimap_scale,
    };
    dims["width"] += 6;
    dims["height"] += 6;
    minimap.css(dims);
    updateMinimap();
    unclickable(minimap);
    var mc = $("#minimap_canvas");
    unclickable(mc);
    dims["width"] -= 6;
    dims["height"] -= 6;
    mc.attr(dims);
    mc.css({ "left": 0, "top": 0 })
    minimap.show();
	
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

    // begin updating the thumbail
    updateThumbnail();
    setInterval(updateThumbnail, thumbnailUpdateInterval);
}

// updates the minimap thumbnail
var mc = $("#minimap_canvas");
var mcc = mc.get(0).getContext("2d");
mcc.globalAlpha = 0.6;
function updateThumbnail() {
    for (var tileX = 1; tileX <= tilesHorizontal; tileX++) {
        for (var tileY = 1; tileY <= tilesVertical; tileY++) {
            var tileid = "tile_" + tileX + "_" + tileY;
            var tile = $("#" + tileid);
            var scaled_xpos = (tileX-1)*tileSize*minimap_scale;
            var scaled_ypos = (tileY-1)*tileSize*minimap_scale;
            var scaled_size = minimap_scale*tileSize;
            mcc.drawImage(tile.get(0), scaled_xpos, scaled_ypos, scaled_size,
                scaled_size);
        }
    }
}

// update the minimap "screen" thing when we get resized/scrolled
// also used to initialize the object!
function updateMinimap() {
    $("#minimap_screen").css({
        "width": window.innerWidth*minimap_scale,
        "height": window.innerHeight*minimap_scale,
        "top": window.scrollY*minimap_scale,
        "left": window.scrollX*minimap_scale
    });
}
$(document).scroll(updateMinimap);
$(window).resize(updateMinimap);

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
        if (black) {
            context.fillStyle = darkColor;
            context.fillRect(0, 0, tileSize, tileSize)
        } else {
            context.clearRect(0, 0, tileSize, tileSize);
        }
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
    if (doingImage) {
        var tileid = event.target.id;
        var image_info = {
            "x": lastrx,
            "y": lastry,
            "url": $(".pre_img").attr("src"),
            "tile": tileid
        };
        socket.emit("image", image_info);
        $(".pre_img").remove();
        doingImage = false;
    } else {
        switch (event.which) {
            case 1:
                action = "paint";
                break;
            default:
                action = "drag";
                break;
        }
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

var arrow_left = 37;
var arrow_up = 38;
var arrow_right = 39;
var arrow_down = 40;
var step = 50;

// scrolling functions
function scrollRight(len) {
    $("body").scrollLeft($("body").scrollLeft() + len);
}
function scrollDown(len) {
    $("body").scrollTop($("body").scrollTop() + len);
}

// event handler for keys
function handler_keydown(e) {
    if (e.keyCode == arrow_left) {
        scrollRight(-step);
    } else if (e.keyCode == arrow_right) {
        scrollRight(step);
    } else if (e.keyCode == arrow_up) {
        scrollDown(-step);
    } else if (e.keyCode == arrow_down) {
        scrollDown(step);
    }
}
$(document).keydown(handler_keydown);

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
    // if we're gonna put an image, move it around
    if (doingImage) {
        $(".pre_img").css({
            "left": xpos,
            "top": ypos
        });
    }
    if (action == "drag") {
        // FIXME
        // right click means we're dragging
        //if (xpos == lastx && ypos == lasty) return false;
        //if (xpos == oldx && ypos == oldy) return false;
        //var sctop = $("body").scrollTop();
        //var scleft = $("body").scrollLeft();
        //$("body").scrollTop(sctop + lasty - ypos);
        //$("body").scrollLeft(scleft + lastx - xpos);
        //scrollRight(oldy - lasty);
        //scrollDown(oldx - lastx);
    } else if (action == "paint") {
        // left click means paint, or do image
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

// makes the element unclickable and delegates its clicks to the canvas
function unclickable(elem) {
    elem.mousedown(delegator);
    elem.mouseup(delegator);
    elem.mousemove(delegator);
    elem.contextmenu(event_eater);
    elem.select(event_eater);
    elem.show();
}

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

// someone else sent an image
socket.on("image", function(img_data) {
    var img = new Image;
    img.src = img_data["url"];
    var tile = $("#" + img_data["tile"]);
    var ctx = tile.get(0).getContext("2d");
    ctx.drawImage(img, img_data["x"], img_data["y"]);
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
    unclickable(cursor);
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

// escape html
var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&quot;",
  "\"": "&#39;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;"
};

function escape_html (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

var doingImage = false;
// prepare to send an image
function doImage() {
    if (doingImage) return;
    var url = prompt("Insert the image URL:");
    if (url) {
        url = escape_html(url);
        $("#imageHolder").append("<img src=\"" + url + "\" class=\"pre_img\">");
        unclickable($(".pre_img"));
        doingImage = true;
    }
}

// user left our room, delete their cursor element to save memory
socket.on("left", removeCursor);
