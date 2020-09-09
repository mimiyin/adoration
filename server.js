// Create server
let port = process.env.PORT || 8000;
let express = require("express");
let app = express();

//Redirect http => to https
// app.use(
//   function(req, res, next) {
//     if (req.hostname == "localhost") next();
//     else {
//       console.log("Are you secure?", req.headers['x-forwarded-proto']);
//       console.log("Hi there.", req.subdomains, req.hostname, req.originalUrl);
//       console.log(req.headers);
//       if (req.headers['x-forwarded-proto'] != 'https') {
//         console.log('Not secure.');
//         res.redirect(301, 'https://' + req.hostname + req.originalUrl);
//       } else {
//         next();
//       }
//     }
//   });

// Point to static folder
app.use(express.static('public'));

// Create seruver
let server = require("http")
  .createServer(app)
  .listen(port, function() {
    console.log("Server listening at port: ", port);
  });


// Server side data
let astart = false;
let vstart = false;
let config;

// Create socket connection
let io = require("socket.io").listen(server);
// Audience audiences
let audience = io.of("/audience");
// Usher
let ushers = io.of("/usher");
// NiNi, video performer
let performers = io.of("/performer");
// Conductor's voice
let voices = io.of("/voice");
// Conductor
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
    socket.emit('start', vstart);
  });

  // Listen for data messages from this client
  socket.on("data", data => {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'data' " + data);
    let message = {
      type: "voice",
      id: socket.id,
      data: data
    };
    performers.emit("data", data);
    conductors.emit("message", message);
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
    socket.emit('start', vstart);
  });

  // Pass on request to record
  socket.on("start", start => {
    console.log("Voice start?", start);

    // Store start status
    vstart = start;

    // Turn on conductors
    conductors.emit("start", vstart);
    // Turn on voice performer
    voices.emit("start", vstart);
  });

  // Give connected Clients
  socket.on("get user count", () => {
    updateAudienceCount();
  });

  // Communicate with performer
  socket.on("config", _config => {
    config = _config;
    performers.emit("config", config);
  });

  // Show intro
  socket.on("intro", intro => {
    performers.emit("intro", intro);
  });

  // Finale
  socket.on("end", end => {
    performers.emit("end", end);
  })

  // Show/hide end
  socket.on("curtain", curtain => {
    performers.emit("curtain", curtain);
  });

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("A conductor client has disconnected " + socket.id);
  });
});

// Listen for audience clients to connect
audience.on("connection", socket => {
  console.log("An audience client connected: " + socket.id);

  // Failed to turn on mic
  socket.on("no mic", () => {
    console.log(socket.id + " has no mic.");
  });

  // Give start status
  socket.on("get start", () => {
    // Print success message
    console.log(socket.id + " successfully completed mic test.");

    // Sent recording status
    socket.emit('start', astart);
  });

  // Listen for data messages from this client
  socket.on("data", data => {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'data' " + data);

    // Package up data with socket's id
    let message = {
      type: "audience",
      id: socket.id,
      data: data
    };

    // Send it to usher clients
    ushers.emit("message", message);
    //conductors.emit("message", message);
    // Send to conductors 20 seconds later
    //let delay = Math.floor(Math.random() * 5) * 20 * 1000;
    setTimeout(()=>{
      conductors.emit("message", message);
    }, 20 * 1000);
  });

  // Listen for this audience client to disconnect
  // Tell all of the output clients this client disconnected
  socket.on("disconnect", () => {
    console.log("An audience client has disconnected " + socket.id);
    conductors.emit("disconnected", socket.id);
    updateAudienceCount();
  });
});

// Listen for output clients to connect
ushers.on("connection", socket => {
  console.log("An usher client connected: " + socket.id);

  // Give start status
  socket.on("get start", () => {
    // Sent recording status
    socket.emit('start', astart);
  });

  // Pass on request to record
  socket.on("start", start => {
    console.log("Audience start?", start);

    // Store audience start status
    astart = start;
    // Turn on audience
    audience.emit("start", astart);
    // Turn on other ushers
    ushers.emit("start", astart);
  });

  // Listen for this output client to disconnect
  socket.on("disconnect", () => {
    console.log("An usher client has disconnected " + socket.id);
  });
});

// Get audience count
function updateAudienceCount() {
  let audienceSockets = audience.sockets;
  let count = Object.keys(audienceSockets).length;
  for (let s in audienceSockets) console.log(s);
  console.log("Audience Count:", count);
  conductors.emit("user count", count);
}
