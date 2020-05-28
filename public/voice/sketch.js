// Open and connect input socket
let socket = io("/voice");
let start = false;
let audio;
let sum = 0;

// Listen for confirmation of connection
socket.on("connect", () => {
  console.log("Connected");
});

// Get media streams
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");
  navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
        echoCancellation: true
      }
    )

    // Success callback
    .then(function(stream) {
      audio = stream.getAudioTracks()[0];
      audio.enabled = false;
      let audioContext = new AudioContext();
      let analyser = audioContext.createAnalyser();
      let microphone = audioContext.createMediaStreamSource(stream);
      let scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      // Process the audio
      scriptProcessor.onaudioprocess = function() {
        let bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        sum = 0;

        let length = bins.length;
        // Add up amp for each frequency bin
        for (let bin of bins) {
          sum += bin / 256;
        }
        console.log("LEVEL: ", sum / bins.length);
        socket.emit("data", sum / bins.length);
      };

      // Set-up start status
      socket.on('start', _start =>{
        start = _start;
        audio.enabled = start;
      });
      socket.emit('get start');
    })
    // Error callback
    .catch(function(err) {
      console.log("The following getUserMedia error occured: " + err);
    });
} else {
  console.log("getUserMedia not supported on your browser!");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Listen for start once the p5 sketch fires up
  socket.on("start", _start => {
    console.log("START?", _start);
    start = _start;
    audio.enabled = start;
    background(0);
  });

  // Styling
  noStroke();
  background(0);
}

function draw() {
  let sz = map(sum, 0.1, 1, 0, 5);
  fill(255, 2);
  ellipse(random(width), random(height), sz, sz);
}
