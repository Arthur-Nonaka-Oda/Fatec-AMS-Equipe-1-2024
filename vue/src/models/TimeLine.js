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
      } else {
        if (position === 'start') {
          newNode.next = layer.head;
          layer.head = newNode;
        } else if (position === 'end') {
          layer.end.next = newNode;
          layer.end = newNode;
        } else if (position === 'middle') {
          // Implementar lógica para adicionar no meio
        }
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