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

// returns a random item from an array
function random_item_from(array) {
    return array[Math.floor(Math.random()*array.length)];
}

// some words to generate 'em cool usernames
var adverb = random_item_from([
    "increasingly", "amazingly", "uniquely", "absolutely", "never",
    "dangerously", "highly", "extremely", "astonishingly", "utterly", "overly",
    "secretly", "apparently", "radically", "awfully", "shamefully", "mostly",
    "poorly", "internally", "unfairly", "merely", "very", "quite", "fairly",
    "monstrously", "super", "super_duper", "hyper", "excessively", "actually",
    "ironically", "unironically", "honestly", "reluctantly", "profoundly",
    "unnecessaryly", "accidentally", "awkwardly", "foolishly", "politely",
    "nervously", "hopelessly", "devotedly", "gracefully", "enormously",
    "mysteriously", "wildly", "happily", "blindly", "eagerly", "always",
    "badly", "rudely", "doubtfully", "elegantly", "selfishly", "prodigiously",
    "defiantly", "beautifully", "effortlessly", "unethically", "surprisingly",
    "unsurprisingly"
]);
var adjective = random_item_from([
    "cool", "ugly", "weird", "unlikable", "lonely", "crazy",
    "handsome", "interesting", "boring", "funky", "explosive", "dynamic",
    "unique", "unsettling", "annoying", "shiny", "shy", "outgoing", "smart",
    "intelligent", "dangerous", "transparent", "honest", "trustworthy",
    "seasonal", "neverending", "immortal", "dying", "suicidal", "cruel",
    "unforgetting", "communist", "fascist", "healthy", "unhealthy", "fried",
    "cooked", "stubborn", "sleepy", "powerful", "flying", "skillful", "evil",
    "skeptical", "religious", "atheist", "terrorist", "rare", "fat",
    "carcinogenic", "toxic", "smelly", "spinning", "inbred", "patriotic",
    "dishonest", "sick", "mad", "angry", "cheesy", "oily", "dumb", "broken",
    "unfixable", "destroyed", "creative", "godlike", "manic", "depressive",
    "schizophrenic", "lovely", "contagious", "infected", "destructive", "sexy",
    "attractive", "unattractive", "cute", "bitter", "rich", "poor", "salty",
    "sweet"
]);
var thing = random_item_from([
    "potato", "bear", "computer", "guy", "dog", "cat", "kitten",
    "cellphone", "brick", "puppy", "minion", "squirrel", "programmer", "spy",
    "politician", "table", "mop", "rag", "shopping_cart", "bomb", "grenade",
    "tree", "apple", "orange", "bacterium", "virus", "president", "pepe",
    "duck", "goldfish", "professor", "physicist", "ball", "triangle", "lad",
    "policeman", "genius", "kid", "soup_can", "dictator", "grandpa", "grandma",
    "bodybuilder", "burglar", "burrito", "taco", "beans", "tortilla", "teapot",
    "sausage", "lizard", "mushroom", "gamer", "doorbell", "lamp_bulb", "rat",
    "telephone", "hairball", "antenna", "car"," bike", "ant", "spider", "egg",
    "walrus", "scientist", "neutrino", "ghost", "bird", "pigeon", "wizard",
    "witch", "magician", "hero", "mom", "dad", "drug_dealer", "salt_shaker",
    "chewing_gum", "chocolate_bar", "rock", "box", "kidney", "liver"
]);

var generated_username = [adverb, adjective, thing].join("_");
$("#username").val(generated_username);

// when a user joins, update the user count
socket.on("usercount", function(msg) {
    $("#drawingCount").html(msg["usercount"]);
    $("#gateCount").html(msg["usercount"]);
    if ($("#username").val() == "")
        $("#username").val("user" + (msg["usercount"]+1))
});

// called when the user tries to join a room and get drawing
function doGate() {
    if (drawing) return;
    var args = {
        "username": $("#username").val(),
        "room": $("#room").val()
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
        drawing = true;
        getDrawing();
    }
});
