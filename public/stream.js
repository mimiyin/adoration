function getStream(cb) {
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
        audio.enabled = true;
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

          // Re-calculate volume every time
          if(completed) sum = 0;

          let length = bins.length;
          // Add up amp for each frequency bin
          for (let bin of bins) {
            sum += bin / 256;
          }

          if (completed) {
            sum = audio.enabled ? sum : 0;
            socket.emit("data",  nfs(sum / bins.length, 0, 3));
          }
        };

        // Set-up start status
        cb();
      })
      // Error callback
      .catch(function(err) {
        console.log("The following getUserMedia error occured: " + err);
        socket.emit('no mic');
      });
  } else {
    console.log("getUserMedia not supported on your browser!");
    socket.emit('no mic');
  }
}
