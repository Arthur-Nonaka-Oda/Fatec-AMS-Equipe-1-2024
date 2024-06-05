let mediaRecorder;
let chunks = [];
let isRecording = false;
const textPlay = document.getElementById("textPlay");
const imagePlay = document.getElementById("imagePlay");

document.getElementById("startButton").addEventListener("click", async () => {
  if (!isRecording) {
    startRecording();
    textPlay.innerHTML = "Parar";
    imagePlay.src = "imagens/pararIcone.png";
    isRecording = true;
  } else {
    stopRecording();
    imagePlay.src = "imagens/gravarIcone.png";
    textPlay.innerHTML = "Gravar";
    isRecording = false;
  }
});

// document.getElementById("stopButton").addEventListener("click", () => {
//   stopRecording();
// });

document.getElementById("pauseButton").addEventListener("click", async () => {
  pauseRecording();
});

document.getElementById("resumeButton").addEventListener("click", () => {
  resumeRecording();
});

// document.getElementById('test').addEventListener('click', () => {
//     window.electron.test();
// });

async function startRecording() {
  try {
    // const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    Notification.requestPermission().then(function (permission) {
      console.log("Notification permission: ", permission);
    });

    const selectedScreen = await window.electron.selectScreen();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "desktop",
        },
      },
      // audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: selectedScreen.id,
        },
      },
    });

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const { filePath } = await window.electron.saveDialog();
      if (filePath) {
        const arrayBuffers = await Promise.all(
          chunks.map((blob) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsArrayBuffer(blob);
            });
          })
        );
        await window.electron.saveRecording({ chunks: arrayBuffers, filePath });
      }
      chunks = [];
    };

    mediaRecorder.start();
  } catch (err) {
    console.log(err);
  }
}

function resumeRecording() {
  mediaRecorder.resume();
}
function pauseRecording() {
  mediaRecorder.pause();
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}
