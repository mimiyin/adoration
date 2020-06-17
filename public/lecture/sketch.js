let output;
let lines;
let intro;

function preload() {
  lines = loadStrings("lecture.txt");
}

function setup() {
  noCanvas();

  // Grab intro div
  intro = select("#intro");

  // Set up output video
  output = createVideo("https://cysm.s3.amazonaws.com/cysm-day-1.mp4");
  output.loop();
}


function draw() {

}

function keyPressed() {
  if(keyCode == DELETE) intro.html('');
  else next();
}


function next() {
  let line = lines[l];
  intro.html(line);
}
