let rec;
let chunks = [];
let audio;

function getStream() {
  navigator.mediaDevices.getUserMedia({
      audio: true
    })
    .then(stream => {
      console.log("HAVE STREAM", stream.getTracks());
      // audio = stream.getAudioTracks()[0];
      // audio.enabled = true;
      rec = new MediaRecorder(stream);
      rec.ondataavailable = e => {
        chunks.push(e.data);
        console.log("HELLO?", chunks);
      }
      rec.onstop = e => {
        let blob = new Blob(chunks, {
          'type': 'audio/ogg; codecs=opus'
        });
        chunks = [];
        let data = URL.createObjectURL(blob);
        socket.emit('data', data);
        URL.revokeObjectURL(data);
        console.log("STOP RECORDING", data);
      }
    })
}
