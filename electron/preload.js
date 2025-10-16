const { contextBridge, ipcRenderer } = require("electron");

console.log("🔧 PRELOAD.JS - Iniciando carregamento...");

// Não carregar Importer/Recorder no preload para evitar problemas
// Eles serão instanciados no renderer process

console.log("🌉 PRELOAD.JS - Expondo APIs via contextBridge...");

contextBridge.exposeInMainWorld("electron", {
  // Função para criar recorder no renderer process
  recorder: () => {
    console.log("🎬 Criando instância do Recorder...");
    // Importar dinamicamente no renderer process
    const Recorder = require('../APIs/Recorder');
    return new Recorder();
  },
  
  // Função para criar importer no renderer process  
  importer: () => {
    console.log("📁 Criando instância do Importer...");
    const Importer = require('../APIs/Importer');
    return new Importer();
  },

  ipcRenderer: {
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    send: (channel, ...args) => {
      console.log(`📤 IPC Send: ${channel}`, args);
      ipcRenderer.send(channel, ...args);
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
  },

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
  getDesktopSources: async () => {
    return await ipcRenderer.invoke("get-desktop-sources")
  },
  importDialog: async () => {
    return await ipcRenderer.invoke("import-dialog")
  },
  saveProject: async (projectData) => {
    return await ipcRenderer.invoke("save-project", { projectData })
  },
  loadProject: async (projectId) => {
    return await ipcRenderer.invoke("load-project", { projectId })
  },
  getProjects: async () => {
    return await ipcRenderer.invoke("get-projects")
  },
  saveImports: async (filePath) => {
    return await ipcRenderer.invoke("save-imports", { filePath })
  }
});

console.log("🎉 PRELOAD.JS - APIs expostas com sucesso!");
console.log("🔍 PRELOAD.JS - window.electron deve estar disponível agora");