import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";
import { TimelineHistory } from './TimelineHistory'; // NOVO

export default class TimeLine {
  constructor() {
    this.layers = [{ head: null, end: null }, { head: null, end: null }, { head: null, end: null }];
    this.currentSecond = 0;
    this.history = new TimelineHistory(); // NOVO
    this.executeCommand = this.executeCommand.bind(this); // NOVO
  }

  executeCommand(command) {
    command.execute();
    this.history.addAction(command.execute, command.undo);
  }

  // Modificado para usar o sistema de histórico
  addFileToLayer(fileData, position = 'end') {
    const originalState = this.getSnapshot();
    const layerIndex = fileData.layerIndex;
    const execute = () => {
      // Implementação original:
      if (layerIndex >= 0 && layerIndex < this.layers.length) {
        const newNode = this.createNode(fileData);
        const layer = this.layers[layerIndex];

        if (layer.head === null) {
          layer.head = newNode;
          layer.end = newNode;
        } else if (typeof position === 'number') {
          let current = layer.head;
          let prev = null;
          let index = 0;

          while (current && index < position) {
            prev = current;
            current = current.next;
            index++;
          }

          if (prev) {
            prev.next = newNode;
            newNode.next = current;
          } else {
            newNode.next = layer.head;
            layer.head = newNode;
          }

          if (!newNode.next) {
            layer.end = newNode;
          }
        } else if (position === 'start') {
          newNode.next = layer.head;
          layer.head = newNode;
        } else if (position === 'end') {
          layer.end.next = newNode;
          layer.end = newNode;
        }
      }
      this.updateVueLayers();
    };

    const undo = () => {
      this.restoreSnapshot(originalState);
      this.updateVueLayers();
    };

    this.executeCommand({ execute, undo });
  }

  // Métodos auxiliares para snapshots
  getSnapshot() {
    return JSON.parse(JSON.stringify({
      layers: this.layers.map(layer => this.listFilesInLayer(this.layers.indexOf(layer))),
      currentSecond: this.currentSecond
    }));
  }

  restoreSnapshot(snapshot) {
    this.layers = snapshot.layers.map(layerFiles => {
      const layer = { head: null, end: null };
      layerFiles.forEach(file => {
        const node = new Node(file);
        if (!layer.head) {
          layer.head = node;
          layer.end = node;
        } else {
          layer.end.next = node;
          layer.end = node;
        }
      });
      return layer;
    });
    this.currentSecond = snapshot.currentSecond;
  }

  // Atualizar outros métodos para usar executeCommand...
  moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
    const originalState = this.getSnapshot();
    const execute = () => {
      // Implementação original do moveItem:
      const sourceLayer = this.layers[sourceLayerIndex];
      let current = sourceLayer.head;
      let prev = null;
      let count = 0;

      while (current && count < sourceIndex) {
        prev = current;
        current = current.next;
        count++;
      }

      if (!current) return;

      if (prev) {
        prev.next = current.next;
      } else {
        sourceLayer.head = current.next;
      }

      const targetLayer = this.layers[targetLayerIndex];
      let targetCurrent = targetLayer.head;
      let targetPrev = null;
      count = 0;

      while (targetCurrent && count < targetIndex) {
        targetPrev = targetCurrent;
        targetCurrent = targetCurrent.next;
        count++;
      }

      if (targetPrev) {
        targetPrev.next = current;
        current.next = targetCurrent;
      } else {
        current.next = targetLayer.head;
        targetLayer.head = current;
      }

      if (!current.next) {
        targetLayer.end = current;
      }
      this.updateVueLayers();
    };

    const undo = () => {
      this.restoreSnapshot(originalState);
      this.updateVueLayers();
    };

    this.executeCommand({ execute, undo });
  }

  // Método para atualizar as camadas no Vue
  updateVueLayers() {
    if (this.updateLayersCallback) {
      this.updateLayersCallback(this.getLayersForVue());
    }
  }

  // Registrar callback para atualização do Vue
  registerUpdateLayers(callback) {
    this.updateLayersCallback = callback;
  }

  addLayer() {
    this.layers.push({ head: null, end: null });
  }

  removeLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
    }
  }

  removeFileFromLayer(fileData) {
    // Captura o estado original antes da remoção
    const originalState = this.getSnapshot();
    
    const execute = () => {
      if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
        const layer = this.layers[fileData.layerIndex];
        if (layer.head !== null) {
          let current = layer.head;
          let before = null;
          
          // Se for o primeiro item da lista
          if (current.item === fileData.file) {
            layer.head = current.next;
            if (layer.end === current) {
              layer.end = null;
            }
            this.updateVueLayers();
            return;
          }
          
          // Procura o item na lista
          while (current !== null) {
            if (current.item === fileData.file) {
              if (layer.end === current) {
                layer.end = before;
              }
              if (before !== null) {
                before.next = current.next;
              }
              this.updateVueLayers();
              return;
            }
            before = current;
            current = current.next;
          }
        }
      }
    };

    const undo = () => {
      this.restoreSnapshot(originalState);
      this.updateVueLayers();
    };

    // Registra a ação no histórico e executa
    this.executeCommand({ execute, undo });
  }

  saveProject() {
    const projectData = JSON.stringify({
      layers: this.layers.map((layer) => ({
        files: this.listFilesInLayer(this.layers.indexOf(layer)).map((file) => ({
          type: file.constructor.name.toLowerCase(),
          data: file,
        })),
      })),
      currentSecond: this.currentSecond,
    });

    localStorage.setItem("savedProject", projectData);
    console.log("Projeto salvo!");
  }

  loadProject() {
    const savedData = localStorage.getItem("savedProject");
    if (!savedData) {
      console.warn("Nenhum projeto salvo encontrado.");
      return;
    }

    const parsedData = JSON.parse(savedData);
    this.layers = parsedData.layers.map(() => ({
      head: null,
      end: null,
    }));

    parsedData.layers.forEach((layer, layerIndex) => {
      layer.files.forEach(({ type, data }) => {
        this.addFileToLayer({ file: data, type, layerIndex });
      });
    });

    this.currentSecond = parsedData.currentSecond;
    console.log("Projeto carregado!");
  }

  downloadProject() {
    const blob = new Blob([localStorage.getItem("savedProject")], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "projeto.json"; // Nome do arquivo baixado
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      localStorage.setItem("savedProject", event.target.result); // Salva o conteúdo no localStorage
      this.loadProject(); // Restaura o estado do projeto
    };
    reader.readAsText(file); // Lê o arquivo como texto
  }


  listFilesInLayer(layerIndex) {
    if (layerIndex >= 0 && layerIndex < this.layers.length) {
      let files = [];
      let current = this.layers[layerIndex].head;
      while (current !== null) {
        files.push(current.item);
        current = current.next;
      }
      return files;
    }
    return [];
  }

  setCurrentSecond(second) {
    this.currentSecond = second;
  }

  createNode({ file, type }) {
    switch (type) {
      case "video":
        return new Node(new Video(file));
      case "audio":
        return new Node(new Audio(file));
      case "image":
        return new Node(new Image(file));
    }
  }

  async splitVideoAtTime(video, splitTime) {
    const layerIndex = this.layers.findIndex(layer =>
      this.listFilesInLayer(this.layers.indexOf(layer)).includes(video)
    );
    
    if (layerIndex === -1) {
      console.error("Vídeo original não encontrado na camada.");
      return;
    }
    
    const command = new SplitCommand(this, video, splitTime, layerIndex);
    this.executeCommand({
      execute: () => command.execute(),
      undo: () => command.undo()
    });
  }

  async splitAudioAtTime(audio, splitTime) {
    const start = audio.startTime || 0;
    const end = audio.endTime || audio.duration;
  
    if (splitTime <= start || splitTime >= end) {
      console.error("Tempo de divisão inválido.");
      return;
    }
  
    const segment1Duration = splitTime - start;
    const segment2Duration = end - splitTime;
  
    const audioPart1 = new Audio({
      ...audio,
      name: audio.name + " (Parte 1)",
      duration: segment1Duration,
      startTime: start,
      endTime: splitTime,
    });
  
    const audioPart2 = new Audio({
      ...audio,
      name: audio.name + " (Parte 2)",
      duration: segment2Duration,
      startTime: splitTime,
      endTime: end,
    });
  
    const layerIndex = this.layers.findIndex(layer =>
      this.listFilesInLayer(this.layers.indexOf(layer)).includes(audio)
    );
  
    const originalIndex = this.listFilesInLayer(layerIndex).indexOf(audio);
    this.removeFileFromLayer({ file: audio, layerIndex });
    this.addFileToLayer({ file: audioPart1, type: "audio", layerIndex }, originalIndex);
    this.addFileToLayer({ file: audioPart2, type: "audio", layerIndex }, originalIndex + 1);
  }

  async splitImageAtTime(image, splitTime) {
  const start = image.startTime || 0;
  const end = image.endTime || image.duration;

  if (splitTime <= start || splitTime >= end) {
    console.error("Tempo de divisão inválido para imagem.");
    return;
  }

  const segment1Duration = splitTime - start;
  const segment2Duration = end - splitTime;

  const imagePart1 = {
    ...image,
    name: image.name + " (Parte 1)",
    duration: segment1Duration,
    startTime: start,
    endTime: splitTime,
  };

  const imagePart2 = {
    ...image,
    name: image.name + " (Parte 2)",
    duration: segment2Duration,
    startTime: splitTime,
    endTime: end,
  };

  const layerIndex = this.layers.findIndex(layer =>
    this.listFilesInLayer(this.layers.indexOf(layer)).includes(image)
  );

  const filesInLayer = this.listFilesInLayer(layerIndex);
  const originalIndex = filesInLayer.indexOf(image);

  if (originalIndex === -1) {
    console.error("Imagem original não encontrada na camada.");
    return;
  }

  this.removeFileFromLayer({ file: image, layerIndex });
  this.addFileToLayer({ file: imagePart1, type: "image", layerIndex }, originalIndex);
  this.addFileToLayer({ file: imagePart2, type: "image", layerIndex }, originalIndex + 1);
}

  getCumulativeDurationBeforeVideo(layerIndex, video) {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return 0;
  
    const layer = this.layers[layerIndex];
    let current = layer.head;
    let cumulativeDuration = 0;
  
    while (current !== null) {
      if (current.item === video) return cumulativeDuration;
      cumulativeDuration += current.item.duration;
      current = current.next;
    }
  
    return 0;
  }

  getLayersForVue() {
    return this.layers.map(layer => ({
      items: this.listFilesInLayer(this.layers.indexOf(layer))
    }));
  }

  // Adicione estes métodos
  undo() {
    if (this.history) {
      this.history.undo();
      this.updateVueLayers();
    }
  }

  redo() {
    if (this.history) {
      this.history.redo();
      this.updateVueLayers();
    }
  }

}

// Comando para split de vídeo com suporte a undo/redo
class SplitCommand {
  constructor(timeline, item, splitTime, layerIndex) {
    this.timeline = timeline;
    this.item = item;
    this.splitTime = splitTime;
    this.layerIndex = layerIndex;
    this.originalState = timeline.getSnapshot();
  }

  execute() {
    const video = this.item;
    const start = video.startTime || 0;
    const end = video.endTime || video.duration;

    if (this.splitTime <= start || this.splitTime >= end) {
      console.error("Tempo de divisão inválido.");
      return;
    }

    const segment1Duration = this.splitTime - start;
    const segment2Duration = end - this.splitTime;

    const videoPart1 = new Video({
      ...video,
      name: video.name + " (Parte 1)",
      duration: segment1Duration,
      startTime: start,
      endTime: this.splitTime,
    });

    const videoPart2 = new Video({
      ...video,
      name: video.name + " (Parte 2)",
      duration: segment2Duration,
      startTime: this.splitTime,
      endTime: end,
    });

    const filesInLayer = this.timeline.listFilesInLayer(this.layerIndex);
    const originalIndex = filesInLayer.indexOf(video);

    if (originalIndex === -1) {
      console.error("Vídeo original não encontrado na camada.");
      return;
    }

    this.timeline.removeFileFromLayer({ file: video, layerIndex: this.layerIndex });
    this.timeline.addFileToLayer({ file: videoPart1, type: "video", layerIndex: this.layerIndex }, originalIndex);
    this.timeline.addFileToLayer({ file: videoPart2, type: "video", layerIndex: this.layerIndex }, originalIndex + 1);
  }

  undo() {
    // Corrigido: Removida a referência a this.history
    this.timeline.restoreSnapshot(this.originalState);
    this.timeline.updateVueLayers();
  }

  redo() {
    // Corrigido: Adicionada implementação correta do redo
    this.execute();
  }
}