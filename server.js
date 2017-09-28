// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// what this does: the server-side part.

// some constants
var port = 9999;
var debug = false;


// get the libraries
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.use(express.static("/public"));

// files the user can access:

app.get("/", function(req, res){
    res.sendFile(__dirname + "/public/draw.html");
});

app.get("/bxdraw.css", function(req, res){
    res.sendFile(__dirname + "/public/bxdraw.css");
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(__dirname + "/public/favicon.ico");
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

function getUserIndexBySocketID(sid) {
    for (var index in users) {
        if (users[index]["socketID"] == sid) {
            return index;
        }
    }
    return -1;
}

// tell people how many people are online
// if no argument is passed, broadcast it
// otherwise, pass a socket and only tell that one user
function usercount(sock) {
    if (!sock) sock = io;
    sock.emit("usercount", {
        "usercount": users.length
    });
}

// handling events
io.on("connection", function(socket) {
    // tell 'em how many users we got
    usercount(socket);

    // user wants to join a room and get drawing    
    socket.on("ready", function(msg) {
        var username = msg["username"].trim();
        var room = msg["room"].trim();
        for (var key in users) {
            if (users[key]["username"] == username) {
                socket.emit("gate", {
                    "status": "FAILED",
                    "message": "Someone already has that username!"
                });
                return false;
            }
        }
        if (!room || !username) {
            socket.emit("gate", {
                "status": "FAILED",
                "message": "Leave neither field empty!"
            })
        } else if (getUserIndexBySocketID(socket.id) > -1) {
            socket.emit("gate", {
                "status": "FAILED",
                "message": "You've already joined!"
            });
        } else {
            users.push({
                "username": username,
                "room": room,
                "socketID": socket.id
            });
            socket.emit("gate", {
                "status": "OK",
                "message": "Get drawing!"
            });
            socket.join(room);
            usercount();
            socket.broadcast.to(room).emit("joined", {
                "username": username
            });
            debugLog("User \"" + username + "\" joined room \"" + room
                + "\"!");
        }
    });
    
    // user painted
    socket.on("paint", function(paint_data) {
        var index = getUserIndexBySocketID(socket.id);
        if (index == -1) return false;
        var user = users[index];
        var room = user["room"]
        var username = user["username"];
        paint_data["user"] = username;
        socket.broadcast.to(room).emit("paint", paint_data);
    });

    // user disconnected
    socket.on("disconnect", function() {
        var index = getUserIndexBySocketID(socket.id);
        if (index > -1) {
            var user = users[index]
            debugLog("User \"" + user["username"] + "\" disconnected!");
            io.to(user["room"]).emit("left", {
                "username": user["username"]
            });
            users.splice(index, 1);
            usercount();
        }
    });

    // user sent cursor position
    socket.on("cursor", function(point) {
        var index = getUserIndexBySocketID(socket.id);
        if (index == -1) return false;
        var user = users[index];
        var room = user["room"];
        var username = user["username"];
        point["user"] = username;
        socket.broadcast.to(room).emit("cursor", point);
    });

    // user sent image
    socket.on("image", function(image_data) {
        var index = getUserIndexBySocketID(socket.id);
        if (index == -1) return false;
        var user = users[index];
        var room = user["room"]
        io.sockets.in(room).emit("image", image_data);
    });
});
