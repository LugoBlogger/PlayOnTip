// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// All CDNs are stored in `lib`


import { HandLandmarker, FilesetResolver } from "../lib/vision_bundle.js";
const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

const audioDir = "../../sound-resources/";
let audioURLs =  [
  "80_Dm_MelodicHarp_SP_50_01.wav",
  "128_Am_InspirationSynth_01_708.wav",
  "120_Am_SynthChords_SP_51_03.wav",
  "120_F_PowerKeys_01_728.wav" ];
audioURLs = audioURLs.map((e) => audioDir + e);


let soundeffect = audioURLs.map((e) => new Audio(e));
const threshold_arr = [0.1, 0.1, 0.1, 0.1];

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
  // const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
  const vision = {
    wasmLoaderPath: `../lib/wasm/vision_wasm_internal.js`,
    wasmBinaryPath: `../lib/wasm/vision_wasm_internal.wasm`,
  }
  console.log(vision);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `../lib/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  });
  demosSection.classList.remove("invisible");
};
createHandLandmarker();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
// Check if webcam access is supported.
const hasGetUserMedia = () => { 
  var _a; 
  return !!(
    (_a = navigator.mediaDevices) === null || _a === void 0 
      ? void 0 : _a.getUserMedia); };
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
}
else {
  console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }
  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  }
  else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }
  // getUsermedia parameters.
  const constraints = {
    video: true
  };
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}
let lastVideoTime = -1;
let results = undefined;
let play_state = false;
let previousIdx;
// console.log(video);
async function predictWebcam() {
  canvasElement.style.width = video.videoWidth;
  canvasElement.style.height = video.videoHeight;
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await handLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, startTimeMs);
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5
      });
      drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });


      // Play audio with your fingertip
      // console.log(results.landmarks[0]);
      playSound(landmarks, soundeffect);

    }
  }
  canvasCtx.restore();
  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }

}

function playSound(landmarks) {

  const THUMB_TIP = landmarks[4];
  const INDEX_FINGER_TIP = landmarks[8]
  const MIDDLE_FINGER_TIP = landmarks[12]
  const RING_FINGER_TIP = landmarks[16]
  const PINKY_TIP = landmarks[20]
  // console.log("hand_landmarks", THUMB_TIP) 
  // console.log("hand_landmarks", INDEX_FINGER_TIP)
  
  const xy_THUMB_TIP = [THUMB_TIP.x, THUMB_TIP.y]
  const xy_NON_THUMB_TIP = [
    [INDEX_FINGER_TIP.x, INDEX_FINGER_TIP.y], 
    [MIDDLE_FINGER_TIP.x, MIDDLE_FINGER_TIP.y],
    [RING_FINGER_TIP.x, RING_FINGER_TIP.y],
    [PINKY_TIP.x, PINKY_TIP.y]]
  const euclid_dist = xy_NON_THUMB_TIP.map(
    (elem_xy) => 
    Math.sqrt(
      (elem_xy[0] - xy_THUMB_TIP[0])**2 + (elem_xy[1] - xy_THUMB_TIP[1])**2
    ));

  // console.log("euclid_dist", euclid_dist);

  const bool_tip = euclid_dist.map((elem, idx) => {
    return elem < threshold_arr[idx]
  });
  const which_tip = bool_tip.reduce(
    (out, bool, index) => bool ? out.concat(index) : out, 
    []);
  const idx_which_tip = which_tip.length == 0 ? 9 : which_tip[0]

  // console.log(bool_tip);
  // console.log(which_tip); 
  // console.log(idx_which_tip);
  // console.log(soundeffect[idx_which_tip]);
  if ((idx_which_tip !== 9) && bool_tip[idx_which_tip] && !play_state) {
    previousIdx = idx_which_tip;
    soundeffect[idx_which_tip].play();
    play_state = true;
  } else if ( (idx_which_tip === 9) && play_state) {
    // console.log(soundeffect[idx_which_tip]);
    console.log(previousIdx);
    soundeffect[previousIdx].pause();
    soundeffect[previousIdx].currentTime = 0;
    play_state = false;
  }
}
