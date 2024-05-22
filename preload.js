const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // MediaRecorder: window.MediaRecorder,
  // startRecording: (mediaRecorder) => {
  //   try {
  //     const chunks = [];
  //     mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  //     mediaRecorder.start();
  //     return new Promise((resolve) => {
  //       mediaRecorder.onstop = async () => {
  //         const { filePath } = await ipcRenderer.invoke("save-dialog");
  //         if (ipcRenderer.emit("write-file", { chunks, filePath })) {
  //           resolve();
  //         }
  //       };
  //     });
  //   } catch (err) {
  //     console.log(err);
  //   }
  // },
  // stopRecording: (mediaRecorder) => mediaRecorder.stop(),


  test: () => console.log("teste"),


  saveRecording: async (chunks, filePath) => ipcRenderer.invoke('write-file',  chunks, filePath ),
  saveDialog: async () => {
    return await ipcRenderer.invoke("save-dialog")

  },
});

// contextBridge.exposeInMainWorld('electron', {
//   startRecording: () => ipcRenderer.send('start-recording'),
//   stopRecording: () => ipcRenderer.send('stop-recording'),
// });
