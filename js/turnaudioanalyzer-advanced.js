window.requestAnimFrame = (function(){
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
  function(callback) { window.setTimeout(callback, 1000 / 60); };
})();

const canvas = document.getElementById('cnvs');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('audioinput');
const playerAudioContext = new AudioContext();
const recorderAudioContext = new AudioContext();

const colorArray = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
		  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
		  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
		  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
		  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
		  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
		  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
		  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
		  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
		  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];


var playerSource, recordSource, recorder, playerAnalyser, recorderAnalyser, activeAnalyser ;
let colorIndex = 0;

document.addEventListener("DOMContentLoaded", function(event) {
  initAnalyzers();
  initPlayer();
  initRecorder();
});

function initPlayer() {
  playerSource = playerAudioContext.createMediaElementSource(audio);
  playerSource.connect(playerAnalyser);
  playerAnalyser.connect(playerAudioContext.destination);
}

function initRecorder() {
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Microphone ready...');
    recordSource = recorderAudioContext.createMediaStreamSource(stream);
    recorder = recordSource.mediaStream;
    recorderAnalyser = recorderAudioContext.createAnalyser();
    recorderAnalyser.smoothingTimeConstant = 0.6;
    recorderAnalyser.fftSize = 64;
    recordSource.connect(recorderAnalyser);
    activeAnalyser = recorderAnalyser;
    freqAnalyser();
    var element = document.getElementById("recorder");
    element.classList.add("active");
  })
  .catch(error => { console.error(error.name + ': ' + error.message); });
}

function initAnalyzers() {
  playerAnalyser = playerAudioContext.createAnalyser();
  playerAnalyser.smoothingTimeConstant = 0.6;
  playerAnalyser.fftSize = 64;

  recorderAnalyser = recorderAudioContext.createAnalyser();
  recorderAnalyser.smoothingTimeConstant = 0.6;
  recorderAnalyser.fftSize = 64;
}

function freqAnalyser(analyser) {
  if (!activeAnalyser || !activeAnalyser.getByteFrequencyData) {
    console.error('No analyser!');
    return;
  }
  window.requestAnimFrame(freqAnalyser);
  let sum;
  let average;
  let num_bars = 30;
  let scaled_average;
  let data = new Uint8Array(32);
  activeAnalyser.getByteFrequencyData(data);

  let bin_size = Math.floor(data.length / num_bars);
  let sdata = [];
  for (var i = 0; i < num_bars; i += 1) {
    sum = 0;
    for (var j = 0; j < bin_size; j += 1) {
      sum += data[(i * bin_size) + j];
    }
    average = sum / bin_size;

    scaled_average = (average / 256) * canvas.height;
    sdata.push(scaled_average);
  }

  let vtype = document.getElementById('vtype').selectedIndex ;
  visualize(sdata, vtype);
}

function visualize(data, vtype) {
  let bar_width = 20;

  switch (vtype) {
    case 1:
      ctx.fillStyle = "red";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < data.length; i++) {
        ctx.fillRect(i * bar_width, canvas.height, bar_width - 5, - data[i]);
      }
      break;
    case 2:
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < data.length; i++) {
        ctx.fillStyle = colorArray[i];
        ctx.fillRect(i * bar_width, canvas.height, bar_width - 5, - data[i]);
      }
      break;
    case 3:
      var gradient = ctx.createLinearGradient(0, 0, 170, 0);
      gradient.addColorStop("0", "magenta");
      gradient.addColorStop("0.5" ,"blue");
      gradient.addColorStop("1.0", "red");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 5;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (var i = 0; i < data.length; i++) {
        ctx.lineTo(40 + i * bar_width, canvas.height - data[i]);
      }
      ctx.stroke();
      break;
    case 4:
      ctx.drawImage(canvas, -2, 0);
      ctx.fillStyle = 'white';
      ctx.fillRect(canvas.width-10, 0, 1, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(canvas.width-10, canvas.height-10, 1, - data[0]/2);
      break;
    case 5:
      if (colorIndex++ > colorArray.length) {
        colorIndex = 0;
      }
      ctx.drawImage(canvas, -2, 0);
      ctx.fillStyle = 'white';
      ctx.fillRect(canvas.width-10, 0, 2, canvas.height);
      ctx.fillStyle = colorArray[colorIndex];
      ctx.fillRect(canvas.width-10, canvas.height-10, 2, - data[0]/2);
      break;
    default:
      // ctx.drawImage(canvas, 2, 0);
      // clear canvas
      // ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      // ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < data.length; i++) {
        ctx.fillRect(i * bar_width, canvas.height, bar_width - 5, - data[i]);
      }
  }
}


function togglePlaying() { // eslint-disable-line no-unused-vars
  if (playerAudioContext && playerAudioContext.state === "suspended") {
    playerAudioContext.resume().then(() => {
      console.log('Playback resumed successfully');
    });
  }

  if (recorder && recorder.active) {
    stopRecording(recorder);
  }
  if (!audio.paused) {
    activeAnalyser = playerAnalyser;
    freqAnalyser();
  }
}

function toggleRecording() { // eslint-disable-line no-unused-vars
  if (recorderAudioContext && recorderAudioContext.state === "suspended") {
    recorderAudioContext.resume().then(() => {
      console.log('Recording resumed successfully');
    });
  }

  if (recorder && recorder.active) {
    stopRecording(recorder);
  } else {

    if (!audio.paused) {
      audio.pause();
    }

    initRecorder();
  }
}

function stopRecording(stream) {
  let tracks = stream.getAudioTracks();
  tracks.forEach(function(track) {
    track.stop();
  });
  var element = document.getElementById("recorder");
  element.classList.remove("active");
}

function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
