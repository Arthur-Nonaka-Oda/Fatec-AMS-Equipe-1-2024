
 function Recorder () {
    this.mediaRecorder = null;
    this.chunks = [];
    

    this.teste = function () {
        console.log("teste");
    }
    this.startRecording = async function () {
        try {
            // const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            // Notification.requestPermission().then(function (permission) {
            //     console.log("Notification permission: ", permission);
            // });
    
            const selectedScreen = await window.electron.selectScreen();
    
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                    },
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
                const { filePath } = await window.electron.saveDialog();
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
                    await window.electron.saveRecording({ chunks: arrayBuffers, filePath });
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

module.exports = Recorder
;