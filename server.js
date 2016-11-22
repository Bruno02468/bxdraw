// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the server-side part.

// some constants
var port = 9999;
var debug = false;


// get the libraries
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);


// files the user can access:

app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/draw.html");
});

app.get("/bxdraw.css", function(req, res){
    res.sendFile(__dirname + "/public/bxdraw.css");
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(__dirname + "/favicon.ico");
});

app.get("/gate.js", function(req, res){
    res.sendFile(__dirname + "/public/gate.js");
});

app.get("/draw.js", function(req, res){
    res.sendFile(__dirname + "/public/draw.js");
});

http.listen(port, function() {
    console.log("bxdraw server listening on port", port)
});


// used for debugging stuff
function debugLog(message) {
    if (debug) console.log("[DEBUG]", message);
}

// current session data will be stored here
users = [];

// handling events
io.on("connection", function(socket) {
    debugLog("A user connected!");
    io.emit("usercount", {
        "usercount": socketIO.engine.clientsCount
    });
    
    // user wants to join a room and get drawing    
    socket.on("ready", function(msg) {
        var username= msg["username"].trim();
        var room = msg["room"].trim();
        for (var key in users) {
            if (users[key]["username"] == room) {
                socket.emit("gate", {
                    "status": "FAILED",
                    "message": "Someone already has that username!"
                });
            } else if (!room || !username) {
                socket.emit("gate", {
                    "status": "FAILED",
                    "message": "Leave neither field empty!"
                })
            } else {
                users.push({
                    "username": username,
                    "room": room
                });
                socket.emit("gate", {
                    "status": "OK",
                    "message": "Get drawing!";
                });
                debugLog("User \"" + username + "\" joined room \"" + room
                    + "\"!");
            }
        }
    });

    socket.on("disconnect", function(){
        debugLog("A user disconnected!");
        io.emit("usercount", conn);
    });
});
