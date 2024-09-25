import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";

export default class TimeLine {
  constructor() {
    this.head = null;
    this.end = null;
    this.currentSecond = 0;
  }

  addVideoToStart(fileData) {

    const newNode = this.createNode(fileData);
    if (this.isNull()) {
      this.head = newNode;
      this.end = newNode;
    } else {
      newNode.next = this.head;
      this.head = newNode;
    }
  }
  
  addFileToEnd(fileData) {
    const newNode = this.createNode(fileData);
    if (this.isNull()) {
      this.head = newNode;
      this.end = newNode;
    } else {
      this.end.next = newNode;
      this.end = newNode;
    }
  }

  addVideoToMiddle(fileData) {
    const newNode = this.createNode(fileData);
    if (this.isNull()) {
      this.head = newNode;
      this.end = newNode;
    } else {
      //fazer
    }
  }

  isNull() {
    if (this.head == null) {
      return true;
    }
    return false;
  }


  setCurrentSecond(second) {
    this.currentSecond = second;
  }

  removeVideo(item) {
    if (!this.isNull()) {
      let current = this.head;
      let before = null;
      if (current.item === item) {
        this.head = current.next;
      }
      while (current != null) {
        if (current.item === item) {
          before.next = current.next;
        }
        before = current;
        current = current.next;
      }
    }
  }

  listVideos() {

    let videos = [];
    let current = this.head;
    while (current != null) {
      videos.push(current.item);
      current = current.next;
    }
    return videos;
  }

  createNode({file, type}) {
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