let mediaRecorder;

document.getElementById('startButton').addEventListener('click', async () => {
    mediaRecorder = new MediaRecorder(
        await navigator.mediaDevices.getDisplayMedia({ video: true })
      );
    window.electron.startRecording(mediaRecorder);
});

document.getElementById('stopButton').addEventListener('click', () => {
    window.electron.stopRecording(mediaRecorder);
});
document.getElementById('test').addEventListener('click', () => {
    window.electron.test();
});