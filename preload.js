const { contextBridge, ipcRenderer } = require("electron");
const Recorder = require("./recorder");
// console.log(Object.getOwnPropertyNames(Recorder.prototype));

contextBridge.exposeInMainWorld("electron", {
  // startRecording,
  // stopRecording,
  // pauseRecording,
  // resumeRecording,
  recorder: () => {
    const recorder = new Recorder();
    return recorder;
    // new Recorder()
  },

  // test: () => console.log("teste"),


  saveRecording: async (chunks, filePath) => ipcRenderer.invoke('write-file', chunks, filePath),
  saveDialog: async () => {
    return await ipcRenderer.invoke("save-dialog")
  },
  permissionDialog: async () => {
    return await ipcRenderer.invoke("permission-dialog")
  },
  selectScreen: async () => {
    return await ipcRenderer.invoke("select-screen")
  },
  importDialog: async () => {
    return await ipcRenderer.invoke("import-dialog")
  }
}); 
