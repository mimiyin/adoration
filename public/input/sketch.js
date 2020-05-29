// Open and connect input socket
let socket = io("/input");
let start = false;
let audio;
let sum = 0;
let tested = false;

// Listen for confirmation of connection
socket.on("connect", () => {
  console.log("Connected");
});

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Get the stream
  getStream(() => {
    socket.on('start', _start => {
      start = _start;
      if (tested) {
        audio.enabled = start;
        background(0);
      }
    });
  });

  // Styling
  noStroke();
  background(0);
  noStroke();
  fill(255, 128);
  textAlign(LEFT, TOP);
  textSize(64);
  text("Make some noise \nto test your mic.", width / 10, height / 10);
}

// Timer for testing the mic
let tts = -1;
function draw() {
  // Welcome messaging
  if (millis() > 20000 && !tested) {
    background(0);
    fill(255);
    text("Nothing happened? \nReload the page \nand try again.", width / 10, height / 10);
  }

  if (tts > 0 && millis()-tts > 10000) {
    tested = true;
    audio.enabled = start;
    background(0);
  }
  else if (sum > 1000) {
    fill(0, 10);
    text("Good. \n\nNow leave this \nwindow open \nand return to \nthe live stream.", width / 10, height / 10);
    if(tts < 0) tts = millis();
  }


  let sz = 10;
  if (tested) sz = map(sum, 0.1, 1, 0, 5);
  else sz = map(sum, 0.1, 10, 0, 5)

  fill(255, 2);
  ellipse(random(width), random(height), sz, sz);
}
