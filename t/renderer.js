let mediaRecorder;
const { MediaRecorder } = window.electron

document.getElementById('startButton').addEventListener('click', async () => {
    // const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
    // mediaRecorder = new MediaRecorder(
    //   );
    // window.electron.startRecording(mediaRecorder);
});

document.getElementById('stopButton').addEventListener('click', () => {
    window.electron.stopRecording(mediaRecorder);
});
document.getElementById('test').addEventListener('click', () => {
    window.electron.test();
});