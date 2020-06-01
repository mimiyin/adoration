let socket = io("/conductor");
// Keep track of users
let users = {};

// Configuration
let modes;
let config;

socket.on("connect", () => {
  console.log("Connected!");
});

function preload() {
  loadJSON("config.json", _config => {
    modes = _config;
    config = _config.config;
    console.log("CONFIG:", config);

    // Update status dislay
    status();

    // Get status from server
    socket.on("start", start => {
      config.start = start;
      status();
    });
    socket.emit("get start");
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  colorMode(HSB, 360, 100, 100);

  // Receive message from server
  socket.on("message", function(message) {
    // Get id and data from message
    let id = message.id;
    let data = message.data;

    // Callback when sound sucessfully loads
    function createUser(sound) {
      console.log("Successfully loaded sound for user:", id);
      sound.setVolume(0);
      sound.loop();
      console.log("Users", users);
      users[id].sound = sound;
    }

    // If new user
    if (!(id in users)) {
      users[id] = {
        sound: null,
        data: data,
        ts: millis()
      };
      // Try to load sound
      try {
        loadSound(config.sound, createUser)
      } catch (e) {
        console.log("Sound failed to load.", e);
        try {
          loadSound("https://cysm.s3.amazonaws.com/yasb.wav", createUser);
        } catch (e) {
          console.log("Sound failed to load from S3.", e);
        }
      }
    } else {
      users[id].data = data;
      if (data > 0) users[id].ts = millis();
    }
  });

  // Remove disconnected users
  socket.on("disconnected", function(id) {
    console.log(id + " disconnected.");
    if (id in users) {
      users[id].sound.setVolume(0);
      users[id].sound.stop();
      delete users[id].sound;
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

  let y = 0;
  let hue = 0;
  let count = 0;
  for (let u in users) {

    // Get user's data
    let user = users[u];
    let sound = user.sound;
    let data = user.data;
    let ts = user.ts;

    // Negate data after a second
    if (config.mute || !config.start || millis() - user.ts > 1000) {
      data = 0;
      // Kill the sound
      if (sound) users[u].sound.setVolume(0);
      // Update stored data
      if (sound) users[u].data = data;
    } else {
      // Set volume
      if (sound) users[u].sound.setVolume(data * config.vol_mult);
    }


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

function keyPressed() {
  // Mode change?
  try {
    let settings = modes[key];
    if (settings) {
      for (let s in settings) {
        let setting = settings[s];
        config[s] = setting;
      }
      emit(key);
    }
  } catch (e) {
    console.log("Was not a mode change.");
  }

  switch (key) {
    case " ":
      toggle();
      break;
    case "m":
      config.mute = !config.mute;
      break;
    case "]":
      config.vol_mult += 0.1;
      config.vol_mult.min(10, config.vol_mult);
      break;
    case "[":
      config.vol_mult -= 0.1;
      config.vol_mult.max(0, config.vol_mult);
      break;
    case "s":
      for (let u in users) {
        users[u].sound.loop();
      }
      break;
    case "c":
      config.crop = !config.crop;
      socket.emit("crop", config.crop);
      console.log("CROP? ", config.crop);
      break;
    case "f":
      config.m_freeze = !config.m_freeze;
      socket.emit("freeze", config.m_freeze);
      console.log("FREEZE? ", config.m_freeze);
      break;
    case "a":
      config.a_freeze = !config.a_freeze;
      socket.emit("auto", config.a_freeze);
      console.log("AUTO-FREEZE? ", config.a_freeze);
      break;
  }

  let ranged = false;
  let rated = false;
  switch (keyCode) {
    case RIGHT_ARROW:
      config.rate += 100;
      rated = true;
      break;
    case LEFT_ARROW:
      config.rate -= 100;
      rated = true;
      break;
    case UP_ARROW:
      config.range += 0.1;
      ranged = true;
      break;
    case DOWN_ARROW:
      config.range -= 0.1;
      ranged = true;
      break;
  }

  // Constrain the rate
  if (rated) {
    config.rate = constrain(config.rate, 100, 10000);
    socket.emit("rate", config.rate);
    console.log("RATE: ", config.rate);
  }

  // Constrain the range
  if (ranged) {
    config.range = constrain(config.range, 0, 1);
    socket.emit("range", config.range);
    console.log("RANGE: ", config.range);
  }

  // Update the status
  status();
}

function emit(mode) {
  console.log("MODE: ", mode);
  console.log("CROP: ", config.crop);
  console.log("FREEZE: ", config.m_freeze);
  console.log("AUTO: ", config.a_freeze);
  console.log("RATE: ", config.rate);
  console.log("RANGE: ", config.range);

  socket.emit("crop", config.crop);
  socket.emit("freeze", config.m_freeze);
  socket.emit("auto", config.a_freeze);
  socket.emit("rate", config.rate);
  socket.emit("range", config.range);
}

function toggle() {
  // Toggle recording
  config.start = !config.start;
  console.log("START", config.start);

  // Tell everyone
  socket.emit("start", config.start);

  // Update status
  status();
}

function status() {
  document.getElementById("record").innerHTML = config.start ?
    "STARTED" :
    "STOPPED";
  document.getElementById("crop").innerHTML = config.crop ? "CROPPED" : "FULL";
  document.getElementById("freeze").innerHTML = "FREEZE: " + config.m_freeze;
  document.getElementById("auto").innerHTML = "AUTO: " + config.a_freeze;
  document.getElementById("rate").innerHTML = "RATE: " + config.rate;
  document.getElementById("range").innerHTML =
    "RANGE: " + nfs(config.range, 0, 1);
  document.getElementById("mute").innerHTML = config.mute ? "MUTED" : "UNMUTED";
  document.getElementById("volume").innerHTML =
    "VOLUME: " + nfs(config.vol_mult, 0, 1);
}
