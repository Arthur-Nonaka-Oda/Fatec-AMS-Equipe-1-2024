import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";

export default class TimeLine {
  constructor() {
    this.layers = [{ head: null, end: null }, { head: null, end: null }, { head: null, end: null }];
    this.currentSecond = 0;
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
      const files = [];
      let current = this.layers[layerIndex].head;
      while (current) {
        files.push(current.item);
        current = current.next;
      }
      return files;
    }
    return [];
  }
  
  addLayer() {
    this.layers.push({ head: null, end: null });
  }

  removeLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
    }
  }

  addFileToLayer(fileData, position = 'end') {
    if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
      const newNode = this.createNode(fileData);
      const layer = this.layers[fileData.layerIndex];

      if (layer.head === null) {
        layer.head = newNode;
        layer.end = newNode;
      } else {
        if (position === 'start') {
          newNode.next = layer.head;
          layer.head = newNode;
        } else if (position === 'end') {
          layer.end.next = newNode;
          layer.end = newNode;
        } else if (position === 'middle') {
          let current = layer.head;
          let prev = null;
          let count = 0;
          const middleIndex = Math.floor(this.listFilesInLayer(fileData.layerIndex).length / 2);

          while (current && count < middleIndex) {
            prev = current;
            current = current.next;
            count++;
          }

          if (prev) {
            prev.next = newNode;
            newNode.next = current;
          }
        }
      }
    }
  }

  removeFileFromLayer(fileData) {
    if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
      const layer = this.layers[fileData.layerIndex];
      if (!layer.head) {
        console.warn("Camada vazia. Nenhum arquivo para remover.");
        return;
      }

      let current = layer.head;
      let before = null;

      while (current) {
        if (current.item === fileData.file) {
          if (before) {
            before.next = current.next;
          } else {
            layer.head = current.next;
          }

          if (!current.next) {
            layer.end = before;
          }

          return;
        }

        before = current;
        current = current.next;
      }

      console.warn("Arquivo não encontrado na camada.");
    }
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
    const start = video.startTime !== undefined ? video.startTime : 0;
    const end = video.endTime !== undefined ? video.endTime : video.duration;
  
    if (splitTime <= start || splitTime >= end) {
      console.error("Tempo de divisão inválido.");
      return;
    }
  
    const segment1Duration = splitTime - start;
    const segment2Duration = end - splitTime;
  
    const videoPart1 = new Video({
      filePath: video.filePath,
      name: video.name + " (Parte 1)",
      duration: segment1Duration,
      size: video.size,
      blob: video.blob,
      url: video.url,
      startTime: start,
      endTime: splitTime
    });
  
    const videoPart2 = new Video({
      filePath: video.filePath,
      name: video.name + " (Parte 2)",
      duration: segment2Duration,
      size: video.size,
      blob: video.blob,
      url: video.url,
      startTime: splitTime,
      endTime: end
    });
  
    this.removeFileFromLayer({ file: video, layerIndex: 0 });
    this.addFileToLayer({ file: videoPart1, type: 'video', layerIndex: 0 });
    this.addFileToLayer({ file: videoPart2, type: 'video', layerIndex: 0 });
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

  
  moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
    if (sourceLayerIndex < 0 || sourceLayerIndex >= this.layers.length ||
        targetLayerIndex < 0 || targetLayerIndex >= this.layers.length) {
      console.error("Índices de camada inválidos.");
      return;
    }
  
    const sourceLayer = this.layers[sourceLayerIndex];
    let current = sourceLayer.head;
    let prev = null;
    let count = 0;
  
    while (current && count < sourceIndex) {
      prev = current;
      current = current.next;
      count++;
    }
  
    if (!current) {
      console.error("Índice de arquivo inválido na camada de origem.");
      return;
    }
  
    if (prev) {
      prev.next = current.next;
    } else {
      sourceLayer.head = current.next;
    }
  
    if (!sourceLayer.head) {
      sourceLayer.end = null;
    } else if (!prev && !current.next) {
      sourceLayer.end = prev;
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
  }

  getLayersForVue() {
    return this.layers.map(layer => ({
      items: this.listFilesInLayer(this.layers.indexOf(layer))
    }));
  }


}