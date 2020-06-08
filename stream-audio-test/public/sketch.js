// Open and connect socket
let socket = io();
let start = false;
let el;
let psound;

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

function setup(){
  noCanvas();

  socket.on('data', data => {
    //el = document.getElementsByTagName('audio')[0];
    //el.src = data;
    loadSound(data, sound =>{
      psound = sound;
      psound.loop();
    });
  });

  // Receive message from server
  getStream();
}

// Toggle recording
function keyPressed() {
  start = !start;
  if (start) rec.start();
  else rec.stop();
}

// Callback to draw position when new position is received
function drawPos(pos) {
  fill(0);
  ellipse(pos.x, pos.y, 10, 10);
}
