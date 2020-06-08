// Create server
let port = process.env.PORT || 8000;
let express = require("express");
let app = express();

//Redirect http => to https
// app.use(
//     function(req, res, next) {
//       console.log("Are you secure?", req.headers['x-forwarded-proto']);
//       console.log("Hi there.", req.subdomains, req.hostname, req.originalUrl);
//       if (req.headers['x-forwarded-proto'] != 'https') {
//         console.log('Not secure.');
//         res.redirect(301, 'https://' + req.hostname + req.originalUrl);
//       } else {
//         next();
//       }
//     });

// Point to static folder
app.use(express.static('public'));


// Create seruver
let server = require("http")
  .createServer(app)
  .listen(port, function() {
    console.log("Server listening at port: ", port);
  });


// Server side data
let start = false;
let config;

// Create socket connection
let io = require("socket.io").listen(server);
// Clients in the input namespace
let inputs = io.of("/input");
// Clients in the output namespace
let performers = io.of("/performer");
// Clients in the output namespace
let voices = io.of("/voice");
// Clients in the output namespace
let conductors = io.of("/conductor");

// Listen for output clients to connect
performers.on("connection", socket => {
  console.log("A performer client connected: " + socket.id);

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A performer client has disconnected " + socket.id);
  });
});

// Listen for output clients to connect
voices.on("connection", socket => {
  console.log("A voice client connected: " + socket.id);

  // Give start status
  socket.on("get start", () => {
    // Sent recording status
    socket.emit('start', !start);
  });

  // Listen for data messages from this client
  socket.on("data", data => {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'data' " + data);
    performers.emit("data", data);
  });

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A voice client has disconnected " + socket.id);
  });
});

// Listen for output clients to connect
conductors.on("connection", socket => {
  console.log("A conductor client connected: " + socket.id);

  // Give start status
  socket.on("get start", () => {
    // Sent recording status
    socket.emit('start', start);
  });

  // Give connected Clients
  socket.on("get user count", () => {
    updateInputCount();
  });

  // Pass on request to record
  socket.on("start", _start => {
    console.log("start!");
    start = _start;
    // Turn on audience
    inputs.emit("start", start);
    // Turn on conductors
    conductors.emit("start", start);
    // Turn off voice performer
    voices.emit("start", !start);
  });

  // Communicate with performer
  socket.on("config", _config => {
    config = _config;
    performers.emit("config", config);
  });

  // Show intro
  socket.on("intro", _intro => {
    performers.emit("intro", _intro);
  });

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A conductor client has disconnected " + socket.id);
  });
});

// Listen for input clients to connect
inputs.on("connection", socket => {
  console.log("An input client connected: " + socket.id);
  updateInputCount();

  // Failed to turn on mic
  socket.on("no mic", () => {
    console.log(socket.id + " has no mic.");
  });

  // Give start status
  socket.on("get start", () => {
    // Print success message
    console.log(socket.id + " successfully completed mic test.");

    // Sent recording status
    socket.emit('start', start);
  });

  // Listen for data messages from this client
  socket.on("data", data => {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'data' " + data);

    // Package up data with socket's id
    let message = {
      id: socket.id,
      data: data
    };

    // Send it to all of the output clients
    conductors.emit("message", message);
    performers.emit("data", data);
  });

  // Listen for this input client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on("disconnect", () => {
    console.log("An input client has disconnected " + socket.id);
    conductors.emit("disconnected", socket.id);
    updateInputCount();
  });
});

// Get input count
function updateInputCount(){
  let inputSockets = inputs.sockets;
  let count = Object.keys(inputSockets).length;
  for(let s in inputSockets) console.log(s);
  console.log("count", count);
  conductors.emit("user count", count);
}
