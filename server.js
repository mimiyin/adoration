// Create server
let port = process.env.PORT || 8000;
let express = require("express");
let app = express();

app.get("*", function(req, res){
  console.log("HELLO HELLO", req)
  res.redirect("https://" + req.headers.host + req.url);
});

// Tell server where to look for files
app.use(express.static("public"));

// Create seruver
let server = require("http")
  .createServer(app)
  .listen(port, function() {
    console.log("Server listening at port: ", port);
  });

// Create socket connection
let io = require("socket.io").listen(server);

// Server side data
let start = false;

// Clients in the output namespace
let performers = io.of("/performer");
// Listen for output clients to connect
performers.on("connection", socket => {
  console.log("A performer client connected: " + socket.id);

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A performer client has disconnected " + socket.id);
  });
});

// Clients in the output namespace
let voices = io.of("/voice");
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

// Clients in the output namespace
let conductors = io.of("/conductor");
// Listen for output clients to connect
conductors.on("connection", socket => {
  console.log("A conductor client connected: " + socket.id);

  // Give start status
  socket.on("get start", () => {
    // Sent recording status
    socket.emit('start', start);
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
  socket.on("range", range => {
    performers.emit("range", range);
  });
  socket.on("rate", rate => {
    performers.emit("rate", rate);
  });
  // Pass on request to crop
  socket.on("crop", crop => {
    performers.emit("crop", crop);
  });
  socket.on("freeze", freeze => {
    performers.emit("freeze", freeze);
  });
  socket.on("auto", auto => {
    performers.emit("auto", auto);
  });

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A conductor client has disconnected " + socket.id);
  });
});

// Clients in the input namespace
let inputs = io.of("/input");
// Listen for input clients to connect
inputs.on("connection", socket => {
  console.log("An input client connected: " + socket.id);

  // Give start status
  socket.on("get start", () => {
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
  });
});
