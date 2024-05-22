const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {


  // test: () => console.log("teste"),


  saveRecording: async (chunks, filePath) => ipcRenderer.invoke('write-file',  chunks, filePath ),
  saveDialog: async () => {
    return await ipcRenderer.invoke("save-dialog")
  },
  permissionDialog: async () => {
    return await ipcRenderer.invoke("permission-dialog")
  },
});