let output;
let lines;
let l = 0;
let intro;

function preload() {
  lines = loadStrings("lecture.txt");
}

function setup() {
  noCanvas();

  // Grab intro div
  intro = select("span");

  // Set up output video
  output = createVideo("https://cysm.s3.amazonaws.com/cysm-day-1.mp4");
  output.loop();
}


function draw() {

}

function keyPressed() {
  if(keyCode == BACKSPACE) intro.html('');
  else next();
}


function next() {
  if(l >= lines.length) return;
  let line = lines[l];
  intro.html(line);
  l++;
}
