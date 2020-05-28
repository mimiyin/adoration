// Open and connect input socket
let socket = io("/input");
let start = false;
let audio;
let sum = 0;
let tested = true;

// Listen for confirmation of connection
socket.on("connect", () => {
  console.log("Connected");
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Get the stream
  getStream(()=>{
    socket.on('start', _start => {
      start = _start;
      audio.enabled = start;
      background(0);
    });
    // Ask for start status
    socket.emit('get start');
  });

  // Styling
  noStroke();
  background(0);
}

function draw() {}
  let sz = map(sum, 0.1, 1, 0, 5);
  fill(255, 2);
  ellipse(random(width), random(height), sz, sz);
}
