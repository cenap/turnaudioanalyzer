window.requestAnimFrame = (function(){
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
  function(callback) { window.setTimeout(callback, 1000 / 60); };
})();

const canvas = document.getElementById('cnvs');
const canvas_context = canvas.getContext('2d');
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
    recorderAnalyser.smoothingTimeConstant = 0.3;
    recorderAnalyser.fftSize = 1024;
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
  playerAnalyser.smoothingTimeConstant = 0.3;
  playerAnalyser.fftSize = 1024;

  recorderAnalyser = recorderAudioContext.createAnalyser();
  recorderAnalyser.smoothingTimeConstant = 0.3;
  recorderAnalyser.fftSize = 1024;
}

function freqAnalyser(analyser) {
  if (!activeAnalyser || !activeAnalyser.getByteFrequencyData) {
    console.error('No analyser!');
    return;
  }
  window.requestAnimFrame(freqAnalyser);
  var sum;
  var average;
  var bar_width;
  var scaled_average;
  var num_bars = 30;
  var data = new Uint8Array(1024);
  activeAnalyser.getByteFrequencyData(data);



  canvas_context.drawImage(canvas, 2, 0);
  // clear canvas
  //canvas_context.clearRect(0, 0, canvas.width, canvas.height);
  canvas_context.fillStyle = "rgba(255, 255, 255, 0.1)";
  canvas_context.fillRect(0, 0, canvas.width, canvas.height);
  var bin_size = Math.floor(data.length / num_bars);
  for (var i = 0; i < num_bars; i += 1) {
    sum = 0;
    for (var j = 0; j < bin_size; j += 1) {
      sum += data[(i * bin_size) + j];
    }
    average = sum / bin_size;
    bar_width = canvas.width / num_bars;
    scaled_average = (average / 256) * canvas.height;
    canvas_context.fillStyle = colorArray[i];
    canvas_context.fillRect(i * bar_width, canvas.height, bar_width - 5, - scaled_average);
  }
}


function togglePlaying() { // eslint-disable-line no-unused-vars
  if (recorder && recorder.active) {
    stopRecording(recorder);
  }
  if (!audio.paused) {
    activeAnalyser = playerAnalyser;
    freqAnalyser();
  }
}

function toggleRecording() { // eslint-disable-line no-unused-vars
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
