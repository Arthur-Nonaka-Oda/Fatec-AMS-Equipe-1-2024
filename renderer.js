let mediaRecorder;
let chunks = [];

document.getElementById('startButton').addEventListener('click', async () => {
    startRecording()
});

document.getElementById('stopButton').addEventListener('click', () => {
    stopRecording();
});

document.getElementById('test').addEventListener('click', () => {
    window.electron.test();
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                }
            }
        });

        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
        }
        mediaRecorder.onstop = async () => {
            const { filePath } = await window.electron.saveDialog();
            if (filePath) {
                const arrayBuffers = await Promise.all(chunks.map(blob => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsArrayBuffer(blob);
                    });
                }));
                await window.electron.saveRecording({ chunks: arrayBuffers, filePath });
            }
            chunks = [];
        };

        mediaRecorder.start();
    }
    catch (err) {
        console.log(err)
    }
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
}