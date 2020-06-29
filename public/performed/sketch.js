// Set up sockets
let socket = io("/performer");
socket.on("connect", () => {
  console.log("Connected");
});

// Set-up posenet
let poseNet;
let joints = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftWrist",
  "rightWrist"
];
let joint = "nose";

// Video
let input, output;
let curtain;
let cropped = {};
let nocrop = {};
let wc = {};
let scl = 1;
let cw, ch;

// Randomize
let randomize = false;
let ejoint = "leftEye";

// Video stream constraints
let ocs = {
  video: {
    width: 1920,
    height: 1080
  },
  audio: false
};

let ics = {
  video: {
    width: 320,
    height: 180
  },
  audio: false
};

// Scaling cropped video to window
let H2W;

// Scaling of input to output video
let I2O = ocs.video.width / ics.video.width;

// Conducting
let config;
let lts = 0;

// Save data
let history = [];
let sts = 0;
let synced = false;

function preload() {
  loadJSON("../config.json", _config => {
    config = _config.config;

    // Listening for instructions from conductor
    socket.on("config", _config => {
      config = _config;
      console.log("CONFIG:", config);
    });
  });
}

function setup() {
  createCanvas(ocs.video.width, ocs.video.height);

  // Calculate center of window
  wc = {
    x: width / 2,
    y: height / 2
  };

  // Calculate no crop
  nocrop = {
    x: wc.x,
    y: wc.y,
    w: ocs.video.width,
    h: ocs.video.height
  }

  // Calculate ratios of window dimensions
  H2W = height / width;

  // Set up output video
  output = createVideo("https://cysm.s3.amazonaws.com/cyss.mp4");
  output.hide();

  // Set up input video
  input = createCapture(ics, stream => {
    console.log("GOT INPUT STREAM");
  });
  input.hide();

  // Set up posenet
  poseNet = ml5.poseNet(input, modelReady);
  poseNet.on("pose", bodiesTracked);

  // Center the image
  imageMode(CENTER);


  // Listen for data
  socket.on("data", level => {

    //console.log("Data", level);
    let go = false;
    let ts = floor(millis());
    if (ts - lts > config.rate) {
      go = true;
      lts = ts;
    }
    if (level > 0.01 && go) update(level);
  });

  // Listen for intro
  socket.on("intro", intro => {
    if (intro) showIntro();
    else hideIntro();
  });

  // Listen for finale
  socket.on("end", end => {
    randomize = !end;
    update(1);
  });

  // Listen for end
  socket.on("curtain", curtain => {
    if (curtain) showCurtain();
    else hideCurtain();
  });

}

function modelReady() {
  console.log("Model has loaded!");
}

function draw() {
  let unfrozen = !config.a_freeze && !config.m_freeze;
  console.log("UNFROZEN? ", unfrozen);

  if (unfrozen) display();
  // Display random dots
  else {
    noStroke();
    fill(255, 16);
    rect(random(width), random(height), 5, 5);
  }

  if (synced) {
    // Save to file
    history.push({
      ts: millis() - sts,
      ots: output.time() * 1000,
      crop: unfrozen ? cropped : nocrop
    });
  }

  //if (frameCount % 180 == 0) console.log(history[history.length - 1]);
}

// Found bodies
function bodiesTracked(bodies) {
  //console.log("Found "+ bodies.length + " bodies.");
  for (let body of bodies) {
    bodyTracked(body.pose);
  }
}

function bodyTracked(_body) {
  body = _body;
}


function resize() {
  cw = output.width * scl;
  ch = cw * H2W;

  cropped.w = cw;
  cropped.h = ch;
}

function update(level) {
  try {
    // Randomize
    if (randomize) joint = body[random(joints)];
    else joint = body[ejoint];

    // Constrain the level
    level = constrain(level, 0, config.range);
    scl = map(level, 0, config.range, 1, 0.1);

    // Resize crop
    resize();

    // Update mid-point
    cropped.x = joint.x * I2O;
    cropped.y = joint.y * I2O;
    recenter();
  } catch (e) {
    console.log("No body.");
  }

  // Auto-freeze
  if (config.a_freeze) display();
}

function recenter() {
  // Re-center
  let hw = cropped.w / 2;
  let hh = cropped.h / 2;
  let left = cropped.x - hw;
  let right = cropped.x + hw - output.width;
  let top = cropped.y - hh;
  let bottom = cropped.y + hh - output.height;

  // Shift center around to fit video crop inside video
  if (left < 0) cropped.x -= left;
  else if (right > 0) cropped.x -= right;
  if (top < 0) cropped.y -= top;
  else if (bottom > 0) cropped.y -= bottom;

  // Shift x,y to corner of cropped area
  cropped.x -= cropped.w / 2;
  cropped.y -= cropped.h / 2;
}

function display() {
  background('white');
  if (config.crop) image(output, wc.x, wc.y, width, height, cropped.x, cropped.y, cropped.w, cropped.h);
  else {
    image(output, wc.x, wc.y, width, height);
  }
}

// Show intro text
let timeouts = [];
let lines = [];

function showIntro() {
  lines = selectAll("p");
  for (let l in lines) {
    let line = lines[l];
    let interval = l < lines.length - 1 ? 3000 : 5000;
    timeouts.push(setTimeout(() => {
      //line.show();
      line.style("display", "inline");
    }, interval * l));
  }
}

// Hide intro text
function hideIntro() {
  for (let line of lines) line.hide();
  for (let timeout of timeouts) {
    clearTimeout(timeout);
  }
}

// Pull curtain
function showCurtain() {
  select("#curtain").show();
}
// Draw curtain
function hideCurtain() {
  select("#curtain").hide();
}

// Save data
function keyPressed() {
  if (keyCode == TAB) {
    // First time there is data to crop
    sts = millis();
    output.play();
    synced = true;
    console.log("SYNCED!!! TS DELTA: ", sts);
  }
  if (key == ' ') saveJSON(history, 'history.json');
}
