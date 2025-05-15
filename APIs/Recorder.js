const { ipcRenderer } = require("electron");
const path = require("path");

function Recorder() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.startCamera = async function () {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoElement.srcObject = stream;
          videoElement.play();
        } catch (error) {
          console.error('Erro ao acessar a câmera:', error);
        }
      }

    this.startRecording = async function () {
        try {

            const selectedScreen = await ipcRenderer.invoke("select-screen");

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                    },
                    video:true,
                },
                // audio: true,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: selectedScreen.id,
                    },
                },
            });

            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (e) => {
                this.chunks.push(e.data);
            };
            this.mediaRecorder.onstop = async () => {
                // const { fileName } = await ipcRenderer.invoke('save-dialog');
                const fileName = `${Date.now()}`;
                const filePath = path.join(__dirname, "../", "videos", fileName);

                if (filePath) {
                    const arrayBuffers = await Promise.all(
                        this.chunks.map((blob) => {
                            return new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsArrayBuffer(blob);
                            });
                        })
                    );
                    try {
                        await ipcRenderer.invoke('write-file', { arrayBuffers, filePath });
                    } catch (error) {
                        console.error('Error writing file:', error);
                    }
                }
                this.chunks = [];
            };

            this.mediaRecorder.start();
        } catch (err) {
            console.log(err);
        }
    };

    this.resumeRecording = async function () {
        this.mediaRecorder.resume();
    }
    this.pauseRecording = async function () {
        this.mediaRecorder.pause();
    }

    this.stopRecording = async function () {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
    }
}

module.exports = Recorder;