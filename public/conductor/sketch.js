let socket = io("/conductor");
// Keep track of users
let users = {};
let num = 0;

// Configuration
let modes;
let config;
let pckeys;

// Mode
let mode = 0;

// Sound file
let source;

function createUser(message) {

  // Get id and data from message
  let type = message.type;
  let id = message.id;
  let data = message.data;

  // Callback when sound sucessfully loads
  function cueSound(sound) {
    sound.setVolume(0);
    sound.jump(random(sound.duration()));
    sound.loop();
    users[id].sound = sound;
    status();
    //console.log("Successfully loaded sound for user:", id, sound);
  }

  // If new user
  if (!(id in users)) {
    // Max out at 100
    if (num >= config.max) return;

    // Get user count
    socket.emit('get user count');

    // Create user
    users[id] = {
      type: type,
      data: data,
      ts: millis(),
      sound: null
    };

    // Try to load sound
    try {
      loadSound(config.sound, cueSound);
    } catch (e) {
      console.log("Sound failed to load.", e);
      try {
        loadSound("https://cysm.s3.amazonaws.com/yasb.wav", cueSound);
      } catch (e) {
        console.log("Sound failed to load from S3.", e);
        console.log("Giving up on ", id);
        delete users[id];
      }
    }
  } else if (users[id]) {
    users[id].data = data;
    if (data > 0) users[id].ts = millis();
  }
}

socket.on("connect", () => {
  console.log("Connected!");
});

function preload() {
  loadJSON("../config.json", _config => {
    modes = _config.modes;
    config = _config.config;
    pckeys = _config.pckeys;
    console.log("CONFIG:", config);

    // Load sound to cache it...
    source = loadSound(config.sound);

    // Update status dislay
    status();

    // Get status from server
    socket.on("start", start => {
      config.start = start;
      status();
    });
    socket.emit("get start");

    // Get user count from server
    socket.on("user count", count => {
      num = count;
      console.log("NUM:", num);
      status();
    });
    socket.emit("get user count");
  });
}

function setup() {
  console.log(source);
  createCanvas(windowWidth, windowHeight);
  background(255);
  colorMode(HSB, 360, 100, 100);

  // Receive message from server
  socket.on("message", function(message) {
    createUser(message);
  });

  // Remove disconnected users
  socket.on("disconnected", id => {
    console.log(id + " disconnected.");
    if (id in users) {
      users[id].sound.setVolume(0);
      users[id].sound.stop();
      delete users[id].sound;
      delete users[id];
      status();
    }

    // Update user count
    socket.emit("get user count");
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

  // Normalize the volume if there's more than 1 user
  let vol_mult = config.vol_mult; //num > 1 ? (config.vol_mult / (1 + (num/config.max))) : config.vol_mult;
  console.log(vol_mult);

  let y = 0;
  let hue = 0;
  for (let u in users) {

    // Get user's data
    let user = users[u];
    let type = user.type;
    let data = user.data;
    let ts = user.ts;
    let sound = user.sound;

    // Negate data after a second
    let mute_all = config.mute;
    let v_mute = config.v_mute && type == "voice";
    let a_mute = config.a_mute && type == "audience";

    // Calculate if more than 1 second has elapsed
    function its_been_a_while() {
      return millis() - user.ts > 1000;
    }

    if (mute_all || v_mute || a_mute || its_been_a_while()) {
      vol_mult = 0;
      // Kill the sound
      if (sound) users[u].sound.setVolume(0);
      // Update stored data
      if (sound) users[u].data = data;
    } else {
      // Set volume
      if (sound) users[u].sound.setVolume(data * vol_mult);
    }


    // Visualize the data
    let ydata = data * 50;
    if (type == "voice") stroke("black");
    else stroke(hue, 100, 100);
    line(x, y, x, y + ydata);
    hue += 30;
    hue %= 100;

    // Shift down
    y += ydata;
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
      mode = key;
      console.log("MODE: ", key, config);
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
    case "v":
      config.v_mute = !config.v_mute;
      break;
    case "n":
      config.a_mute = !config.a_mute;
      break;
    case "]":
      config.vol_mult += 0.1;
      config.vol_mult = min(10, config.vol_mult);
      break;
    case "[":
      config.vol_mult -= 0.1;
      config.vol_mult = max(0, config.vol_mult);
      break;
    case "s":
      for (let u in users) {
        users[u].sound.loop();
      }
      break;
    case "c":
      config.crop = !config.crop;
      break;
    case "f":
      config.m_freeze = !config.m_freeze;
      if (config.m_freeze) config.a_freeze = false;
      break;
    case "a":
      config.a_freeze = !config.a_freeze;
      if (config.a_freeze) config.m_freeze = false;
      break;
    case "i":
      config.intro = !config.intro;
      socket.emit("intro", config.intro);
      break;
    case "e":
      config.end = !config.end;
      socket.emit("end", config.end);
      // Toggle start
      toggle(false);
      config.m_freeze = false;
      config.a_freeze = true;
      break;
  }

  switch (keyCode) {
    case RIGHT_ARROW:
      config.rate += 100;
      break;
    case LEFT_ARROW:
      config.rate -= 100;
      break;
    case UP_ARROW:
      config.range += 0.1;
      break;
    case DOWN_ARROW:
      config.range -= 0.1;
      break;
    case ESCAPE:
      config.curtain = !config.curtain;
      socket.emit("curtain", config.curtain);
      break;

  }

  // Constrain the rate
  config.rate = constrain(config.rate, 10, 10000);

  // Constrain the range
  config.range = constrain(config.range, 0, 1);

  // emit the config updates
  emit();

  // Update the status
  status();
}

// Emit config for performers
function emit(mode) {
  let pconfig = {};
  for (let pckey of pckeys) {
    pconfig[pckey] = config[pckey];
  }
  // Share performance config
  socket.emit("config", pconfig);
}

function toggle(state) {
  // Toggle recording
  if (state) config.start = state;
  else config.start = !config.start;
  console.log("START", config.start);

  // Tell everyone
  socket.emit("start", config.start);

  // Update status
  status();
}

function status() {
  document.getElementById("intro").innerHTML = "INTRO: " + config.intro;
  document.getElementById("end").innerHTML = "END: " + config.end;
  document.getElementById("curtain").innerHTML = "CURTAIN: " + config.curtain;
  document.getElementById("mode").innerHTML = "MODE: " + mode;
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
  document.getElementById("vmute").innerHTML = config.v_mute ? "V_MUTED" : "V_UNMUTED";
  document.getElementById("amute").innerHTML = config.a_mute ? "A_MUTED" : "A_UNMUTED";
  document.getElementById("volume").innerHTML =
    "VOLUME: " + nfs(config.vol_mult, 0, 1);
}
