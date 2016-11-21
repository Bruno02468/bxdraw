// coded by bruno "bruno02468" borges paschoalinoto
// license: gplv3
// respect me code

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
users = {}
