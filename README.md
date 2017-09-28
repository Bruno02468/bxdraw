# bxdraw, a work-in-progress
Multi-user real-time drawing made simple.

Features:
 - Real-time drawing, brush sizes, all of 'em 2²⁴ colors
 - Unlimited rooms and usernames
 - See other people's cursors real-time
 - Live minimap
 - Optional dark background (individual)
 - Insert image by URL
 - Adjustable canvas size and tiling (i.e. it can be real damn big)
 - No flash or special plugins required

Plans:
 - [urgent] An actual goddamn eraser lol
 - [yeah that needs doin'] "Room admin" sort of tools
 - User list
 - Config file
 - Scale the image you're going to send
 - [eventually] Scrolling by dragging and not only arrow keys
 - Saving colors? More color things? Something along that line
 - Transmit current board data to newcomers (so they see what everyone sees)
 - [unlikely] Make draw data "linger" for a while in the server
 - Different brush shapes/opacities/styles? that's kinda hard
 - Make it a bit more user friendly

Setup: just clone the repository, then install the required modules by running "npm install" in the base folder of the working copy.

To start the thing, which runs by default on port 9999, run "node server.js".

Settings? Edit the vars at the top of server.js and public/draw.js until I make an actual config file.

It was meant for teaching. No safeguards. It WILL go full anarchy if it's just out in the wild.

That's pretty much it.

~ Bruno
