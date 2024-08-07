let mediaRecorder;

// const Recorder = require("./recorder");

let chunks = [];
let imports = [];
let videos = [];

// import { Recorder } from "./recorder";
// const {Recorder} = require('./recorder');
// recorder = window.electron.recorder();


let isRecording = false;
const textPlay = document.getElementById("textPlay");
const imagePlay = document.getElementById("imagePlay");

const pauseButton = document.getElementById("pauseButton");

pauseButton.addEventListener("click", async () => {
  pauseRecording();
  pauseButton.style.opacity = 0.5;
  // resumeButton.style.opacity = 1;
});

// const resumeButton = document.getElementById("resumeButton");
// resumeButton.addEventListener("click", () => {
//   resumeRecording();
//   pauseButton.style.opacity = 1;
//   resumeButton.style.opacity = 0.5;
// });

pauseButton.style.opacity = 0.5;
// resumeButton.style.opacity = 0.5;

document.getElementById("startButton").addEventListener("click", async () => {
  if (!isRecording) {
    startRecording();
    textPlay.innerHTML = "Parar";
    imagePlay.src = "imagens/pararIcone.png";
    pauseButton.style.opacity = 1;
    isRecording = true;
  } else {
    stopRecording();
    imagePlay.src = "imagens/gravarIcone.png";
    textPlay.innerHTML = "Gravar";
    pauseButton.style.opacity = 0.5;
    resumeButton.style.opacity = 0.5;
    isRecording = false;
  }
});

// document.getElementById("stopButton").addEventListener("click", () => {
//   stopRecording();
// });


// document.getElementById('test').addEventListener('click', () => {
//     window.electron.test();
// });


// async function startRecording() {
//   try {
//     // const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
//     Notification.requestPermission().then(function (permission) {
//       console.log("Notification permission: ", permission);
//     });

//     const selectedScreen = await window.electron.selectScreen();

//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         mandatory: {
//           chromeMediaSource: "desktop",
//         },
//       },
//       // audio: true,
//       video: {
//         mandatory: {
//           chromeMediaSource: "desktop",
//           chromeMediaSourceId: selectedScreen.id,
//         },
//       },
//     });

//     mediaRecorder = new MediaRecorder(stream);

//     mediaRecorder.ondataavailable = (e) => {
//       chunks.push(e.data);
//     };
//     mediaRecorder.onstop = async () => {
//         const arrayBuffers = await Promise.all(
//           chunks.map((blob) => {
//             return new Promise((resolve, reject) => {
//               const reader = new FileReader();
//               reader.onloadend = () => resolve(reader.result);
//               reader.onerror = reject;
//               reader.readAsArrayBuffer(blob);
//             });
//           })
//         );
//         await window.electron.saveRecording({ chunks: arrayBuffers, filePath });
//       }
//       chunks = [];
//     };

//     mediaRecorder.start();
//   } catch (err) {
//     console.log(err);
//   }
// }

// function resumeRecording() {
//   mediaRecorder.resume();
// }
// function pauseRecording() {
//   mediaRecorder.pause();
// }

// function stopRecording() {
//   if (mediaRecorder) {
//     mediaRecorder.stop();
//   }
// }


const videoElement = document.getElementById("videoElement");
// const mediaSource = new MediaSource();



async function videoToBlob(videoUrl) {
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  return blob;
}

function getVideoDuration(blobUrl) {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video');

    videoElement.onloadedmetadata = function () {
      resolve(videoElement.duration);
    };

    videoElement.onerror = function () {
      reject('Error loading video file.');
    };

    videoElement.src = blobUrl;
  });
}

async function getVideoThumbnail(blobUrl) {
  return new Promise((resolve, reject) => {
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    const context = canvasElement.getContext('2d');

    videoElement.onloadeddata = function () {
      videoElement.currentTime = videoElement.duration / 2;
    };

    videoElement.onseeked = function () {
      context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      const thumbnailUrl = canvasElement.toDataURL('image/png');
      resolve(thumbnailUrl);
    };

    videoElement.onerror = function () {
      reject('Error loading video file.');
    };

    videoElement.src = blobUrl;
  });
}

const videoList = document.getElementById("videos");

const importButton = document.getElementById("importButton");
importButton.addEventListener("click", async () => {
  const { filePath, name} = await window.electron.importDialog();
  if (filePath) {
    const blob = await videoToBlob(filePath);
    const blobUrl = URL.createObjectURL(blob);
    const duration = await getVideoDuration(blobUrl);
    const thumbnailUrl = await getVideoThumbnail(blobUrl);
    imports.push({ name: name, duration: duration, blob: blob, thumbnailUrl: thumbnailUrl });
    console.log(imports);
    const div = document.createElement("div");
    div.innerHTML = `<img src="${thumbnailUrl}" alt="${name}" width="200" height="100">`;
    div.innerHTML += `<p>${name}</p>`;
    div.innerHTML += `<p>${duration} S</p>`;
    // div.innerHTML += `<p>${size} Mb S</p>`;
    videoList.appendChild(div);
    // imports.forEach(x => {
    // });
  }
});