let socket = io("/usher");
// Keep track of users
let users = {};

// Mic status
let start = false;

socket.on("connect", () => {
  console.log("Connected!");
  // Get status from server
  socket.on("start", _start => {
    console.log("START", start);
    start = _start;
  });

  // Get user count
  socket.on("user count", count => {
    console.log("NUM: ", count);
  });
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  colorMode(HSB, 360, 100, 100);

  // Receive message from server
  socket.on("message", message => {
    // Get id and data from message
    let id = message.id;
    let data = message.data;

    // Create or update user
    users[id] = data;
  });

  // Remove disconnected users
  socket.on("disconnected", id => {
    console.log(id + " disconnected.");
    if (id in users) {
      delete users[id];
    }
  });
}

// Position data bar
let x = 0;

function draw() {
  // Draw all the user lines
  // Move across the screen
  x++;
  if (x > width) {
    background(255);
    x = 0;
  }

  // Start drawing 100 pixels down
  let y = 100;
  let hue = 0;

  // Mic status
  noStroke();
  fill(start ? "green" : "red");
  rect(0, 0, width, y);

  for (let u in users) {
    // Get user's data
    let data = users[u];

    // Visualize the data
    let ydata = data * 50;
    stroke(hue, 100, 100);
    line(x, y, x, y + ydata);
    hue += 30;
    hue %= 100;

    // Shift down
    y += ydata;
  }
}

function keyPressed() {
  if (key == ' ') {
    // Toggle recording
    start = !start;

    // Tell everyone
    socket.emit("start", start);
  }
}
