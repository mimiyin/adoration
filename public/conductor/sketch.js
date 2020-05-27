// Open and connect output socket
let socket = io("/conductor");
// Keep track of users
let users = {};

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  colorMode(HSB, 360, 100, 100);

  // Receive message from server
  socket.on("message", function(message) {
    // Get id and data from message
    let id = message.id;
    let data = message.data;
    if (!(id in users)) {
      loadSound(
        "https://cdn.glitch.com/4116ddd1-c2ff-4d1f-a42a-e3d62a7c7382%2Ftest.m4a?v=1589822197722",
        sound => {
          sound.loop();
          users[id] = {
            sound: sound,
            data: data
          };
        }
      );
    } else users[id].data = data;
  });

  // Remove disconnected users
  socket.on("disconnected", function(id) {
    console.log(id + " disconnected.");
    if (id in users) {
      users[id].sound.stop();
      delete users[id];
    }
  });

  // Receive status from server
  socket.on("status", status => {
    start = status;
    update();
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

  let y = 0;
  let hue = 0;
  let count = 0;
  for (let u in users) {
    // Get user's data
    let user = users[u];
    let data = user.data;

    // Set volume
    user.sound.setVolume(data);

    // Visualize the data
    let ydata = data * 50;
    stroke(hue, 100, 100);
    line(x, y, x, y + ydata);
    hue += 30;
    hue %= 100;

    // Shift down
    y += ydata;

    // Count
    count++;
  }
}

// Cuing recording
let start = false;
let rate = 100;
let range = 0.5;
let a_freeze = false;
let m_freeze = false;
function keyPressed() {
  
  switch (key) {
    case ' ':
      toggle();
      break;
    case 'a':
      a_freeze = !a_freeze;
      socket.emit('auto', a_freeze);
      console.log("AUTO-FREEZE? ", a_freeze);
      break;
    case 'f':
      m_freeze = !m_freeze;
      socket.emit('freeze', m_freeze);
      console.log("FREEZE? ", m_freeze);
      break;
  }

  let ranged = false;
  let rated = false;
  switch (keyCode) {
    case UP_ARROW:
      range += 0.1;
      ranged = true;
      break;
    case DOWN_ARROW:
      range -= 0.1;
      ranged = true;

      break;
    case RIGHT_ARROW:
      rate += 100;
      rated = true;
      break;
    case LEFT_ARROW:
      rate -= 100;
      rated = true;
      break;
  }

  // Constrain the range
  if (ranged) {
    range = nfs(constrain(range, 0, 1), 0, 1);
    socket.emit("range", range);
  }
  // Constrain the rate
  if (rated) {
    rate = constrain(rate, 100, 10000);
    socket.emit("rate", rate);
  }

  console.log("RANGE: ", range);
  console.log("RATE: ", rate);
  
  update();
}

function toggle() {
  // Toggle recording
  start = !start;
  console.log("START", start);
  
  // Tell everyone
  socket.emit("start", start);
  
  // Null user data
  if(!start) {
    for (let u in users) {
      let user = null;
    }
  }
  
  // Update status
  update();
}

function update() {
  select("#record").html(start ? "STARTED" : "STOPPED");
  select("#auto").html("AUTO: " + a_freeze);
  select("#freeze").html("FREEZE: " + m_freeze);
  select("#rate").html("RATE: " + rate);
  select("#range").html("RANGE: " + range);
}
