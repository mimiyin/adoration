// Open and connect input socket
let socket = io("/voice");
let audio;
let sum = 0;
let completed = true;

// Listen for confirmation of connection
socket.on("connect", () => {
  console.log("Connected");

  // Log in with the conductor
  socket.emit('data', 0);
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Get the stream
  getStream(()=>{
    // Listen for the start status
    socket.on('start', _start => {
      start = _start;
      audio.enabled = start;
      background(0);
    });

    socket.emit('get start');
  });

  // Styling
  noStroke();
  background(0);
}

function draw() {
  // Wipe out the background every 10 seconds
  if(frameCount%60*10 == 0) background(0);

  let sz = map(sum, 0.1, 1, 0, 5);
  fill(255, 2);
  ellipse(random(width), random(height), sz, sz);
}
