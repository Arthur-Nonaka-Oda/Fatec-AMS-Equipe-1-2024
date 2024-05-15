

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})




// async function startRecord() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//             audio: false,
//             video: {
//                 mandatory: {
//                     chromeMediaSource: 'desktop',

//                     minWidth: 1280,
//                     maxWidth: 1280,
//                     minHeight: 720,
//                     maxHeight: 720
//                 }
//             }
//         })
//         handleStream(stream)
//     } catch (e) {
//         handleError(e)
//     }
// }

// function handleStream(stream) {
//     const video = document.querySelector('video')
//     video.srcObject = stream
//     video.onloadedmetadata = (e) => video.play()
// }

// function handleError(e) {
//     console.log(e)
// }

// const Editor = require("./API/editor");
//   const ffmpeg = require('ffmpeg');
//   const editor = require('../API/editor')
//   window.alertar = function() {
//     return editor
//   }