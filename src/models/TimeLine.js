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
          return;
        }
        while (current !== null) {
          if (current.item === fileData.file) {
            if(layer.end.item === fileData.file) {
              layer.end = before;
              return;
            }
            before.next = current.next;
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
}