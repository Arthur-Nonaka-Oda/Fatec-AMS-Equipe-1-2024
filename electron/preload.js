const { contextBridge, ipcRenderer } = require("electron");
const Importer = require('../APIs/Importer');
const importer = new Importer();
const Recorder = require('../APIs/Recorder');
const recorder = new Recorder();
// console.log(Object.getOwnPropertyNames(Recorder.prototype));

contextBridge.exposeInMainWorld("electron", {
  // startRecording,
  // stopRecording,
  // pauseRecording,
  // resumeRecording,
  recorder: () => {
    return recorder;
  },
  importer: () => {
    return importer;
  },
  ipcRenderer: {
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },

  // test: () => console.log("teste"),


  saveRecording: async (chunks, filePath) => ipcRenderer.invoke('write-file', chunks, filePath),
  saveDialog: async () => {
    return await ipcRenderer.send('save-dialog');
  },
  permissionDialog: async () => {
    return await ipcRenderer.invoke("permission-dialog")
  },
  selectScreen: async () => {
    return await ipcRenderer.invoke("select-screen")
  },
  importDialog: async () => {
    return await ipcRenderer.invoke("import-dialog")
  },
  baixarVideo: async () => {
    return await ipcRenderer.invoke("baixar-video")
  }
}); 

