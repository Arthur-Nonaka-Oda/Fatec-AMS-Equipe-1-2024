const { contextBridge, ipcRenderer } = require("electron");
// const { startRecording, stopRecording, pauseRecording, resumeRecording } = require("./recorder.js");

contextBridge.exposeInMainWorld("electron", {
  // startRecording,
  // stopRecording,
  // pauseRecording,
  // resumeRecording,

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
