// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the stuff before you're drawing.

// the socket, man
var socket = io();

// we aren't drawing yet, so
var drawing = false;

// the room we are (not) in...
var room = null;

// who are we? *shivers*
var username = null;

// when a user joins, update the user count
socket.on("usercount" function(msg) {
    if (drawing) {
        $("#drawingCount").html(msg["usercount"]);
    } else {
        $("#gateCount").html(msg["usercount"]);
    }
});

// called when the user tries to join a room and get drawing
function doGate() {
    var args = {
        "username": $("$username").val(),
        "room": $("room").val()
    };
    room = args["room"];
    username = args["username"];
    socket.emit("ready", args);
    return false;
    // return false so the form doesn't do anything nasty
}

// the gate answers, let's see if we can get drawing
socket.on("gate", function(result) {
    if (result["status"] == "FAILED") {
        // nope.
        $("#err").html(result["message"]);
    } else {
        // oh yeah, let's delegate it to the other script.
        getDrawing();
    }
});
