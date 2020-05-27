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
let crop = {};
let wc = {};
let scl = 1;
let cw, ch;

// Video stream constraints
let ocs = {
  video: {
    width: 1280,
    height: 720
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
let m_freeze = false;
let a_freeze = false;
let rate = 100;
let range = 0.5;
let lts = 0;

function setup() {
  createCanvas(1280, 720);

  // Calculate center of window
  wc = {
    x: width / 2,
    y: height / 2
  };

  // Calculate ratios of window dimensions
  H2W = height / width;

  // Set up output video
  output = createCapture(ocs, stream => {
    console.log("GOT OUTPUT STREAM");
  });
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
    let go = false;
    let ts = floor(millis());
    if(ts - lts > rate) {
      go = true;
      lts = ts;
    }
    if (level > 0.01 && go) update(level);
  });
  
  socket.on("range", _range => {
    range = _range;
  });
  
  socket.on("freeze", _m_freeze => {
    m_freeze = _m_freeze;
    if(m_freeze) a_freeze = false;
  });
  
  socket.on("rate", (_rate) => {
    rate = _rate;
  });
  
  socket.on("auto", _a_freeze=> {
    a_freeze = _a_freeze;
    if(a_freeze) m_freeze = false;
  });
}

function modelReady() {
  console.log("Model has loaded!");
}

function draw() {
  let unfrozen = !a_freeze && !m_freeze;
  console.log("UNFROZEN? ", unfrozen);
  if (unfrozen) display();
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

  crop.w = cw;
  crop.h = ch;
}

function update(level) {
  if (!body) return;
  // Randomize
  joint = body[random(joints)];
  scl = map(level, 0, range, 1, 0);

  // Resize crop
  resize();

  // Update mid-point
  crop.x = joint.x * I2O;
  crop.y = joint.y * I2O;
  recenter();
  
  // Auto-freeze
  if(a_freeze) display();
}

function recenter() {
  // Re-center
  let hw = crop.w / 2;
  let hh = crop.h / 2;
  let left = crop.x - hw;
  let right = crop.x + hw - output.width;
  let top = crop.y - hh;
  let bottom = crop.y + hh - output.height;

  // Shift center around to fit video crop inside video
  if (left < 0) crop.x -= left;
  else if (right > 0) crop.x -= right;
  if (top < 0) crop.y -= top;
  else if (bottom > 0) crop.y -= bottom;

  // Shift x,y to corner of cropped area
  crop.x -= crop.w / 2;
  crop.y -= crop.h / 2;
}

function display() {
  background('red');
  strokeWeight(10);
  line(640, 0, 640, height);
  //background(0);
  //image(output, 0, 0, 1280, 720);
  //translate(video.width, 0);
  image(output, wc.x, wc.y, width, height, crop.x, crop.y, crop.w, crop.h);

}
