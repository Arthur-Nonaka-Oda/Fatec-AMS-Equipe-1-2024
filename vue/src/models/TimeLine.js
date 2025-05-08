import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";

export default class TimeLine {
  constructor() {
    this.layers = [{ head: null, end: null }, { head: null, end: null }, { head: null, end: null }];
    this.currentSecond = 0;
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
  }

  removeFileFromLayer(fileData) {
    if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
      const layer = this.layers[fileData.layerIndex];
      if (layer.head !== null) {
        let current = layer.head;
        let before = null;
        if (current.item === fileData.file) {
          layer.head = current.next;
          if (layer.end === current) {
            layer.end = null;
          }
          return;
        }
        while (current !== null) {
          if (current.item === fileData.file) {
            if (layer.end === current) {
              layer.end = before;
            }
            if (before !== null) {
              before.next = current.next;
            }
            return;
          }
          before = current;
          current = current.next;
        }
      }
    }
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
    const start = video.startTime || 0;
    const end = video.endTime || video.duration;
  
    if (splitTime <= start || splitTime >= end) {
      console.error("Tempo de divisão inválido.");
      return;
    }
  
    const segment1Duration = splitTime - start;
    const segment2Duration = end - splitTime;
  
    const videoPart1 = new Video({
      ...video,
      name: video.name + " (Parte 1)",
      duration: segment1Duration,
      startTime: start,
      endTime: splitTime,
    });
  
    const videoPart2 = new Video({
      ...video,
      name: video.name + " (Parte 2)",
      duration: segment2Duration,
      startTime: splitTime,
      endTime: end,
    });
  
    // Encontra o índice da camada e do vídeo original
    const layerIndex = this.layers.findIndex(layer =>
      this.listFilesInLayer(this.layers.indexOf(layer)).includes(video)
    );
  
    const filesInLayer = this.listFilesInLayer(layerIndex);
    const originalIndex = filesInLayer.indexOf(video);
  
    if (originalIndex === -1) {
      console.error("Vídeo original não encontrado na camada.");
      return;
    }
  
    // Remove o vídeo original
    this.removeFileFromLayer({ file: video, layerIndex });
  
    // Adiciona as partes recortadas na mesma posição
    this.addFileToLayer({ file: videoPart1, type: "video", layerIndex }, originalIndex);
    this.addFileToLayer({ file: videoPart2, type: "video", layerIndex }, originalIndex + 1);
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

  
  moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
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
  }

  getLayersForVue() {
    return this.layers.map(layer => ({
      items: this.listFilesInLayer(this.layers.indexOf(layer))
    }));
  }


}