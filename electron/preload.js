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
  }
}); 

// esta dando erro vou arrumar na proxima aula -_-
async function cutVideo(filePath, startTime, duration) {
  try {
    const base64Video = await window.electron.ipcRenderer.invoke('cut-video', { 
      filePath, 
      startTime, 
      duration 
    });
    // Aqui você pode fazer algo com o vídeo cortado (base64)
    console.log('Video cortado com sucesso!', base64Video);
    return base64Video;
  } catch (error) {
    console.error('Erro ao cortar vídeo:', error);
  }
}
 
// Exemplo de uso
const filePath = 'caminho/do/video.mp4'; // Substitua com o caminho real
const startTime = '00:00:30'; // Início do corte, por exemplo, 30 segundos
const duration = '00:00:10'; // Duração do corte, por exemplo, 10 segundos

cutVideo(filePath, startTime, duration);

// esta dando erro vou arrumar na proxima aula -_-