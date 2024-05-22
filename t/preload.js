const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("electron", {
  startRecording: () => {
    try {
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.start();
      return new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          const { filePath } = await ipcRenderer.invoke("save-dialog");
          if (ipcRenderer.emit("write-file", { chunks, filePath })) {
              resolve();
          }
        };
      });
    } catch (err) {
      console.log(err);
    }
  },
  stopRecording: (mediaRecorder) => mediaRecorder.stop(),
  test: () => console.log("teste"),
  // we can also expose variables, not just functions
});
