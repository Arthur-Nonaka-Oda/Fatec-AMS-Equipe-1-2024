import Video from "../models/Video";
import { TimelineHistory } from "./TimelineHistory";

export default class TimeLine {
  constructor() {
    this.videos = [];
    this.currentSecond = 0;
    this.history = new TimelineHistory(); // Adiciona o sistema de histórico
  }

  addVideo(videoData) {
    const video = new Video(videoData);
    
    // Cria uma ação que pode ser desfeita
    this.history.addAction(
      // Função execute
      () => {
        this.videos.push(video);
      },
      // Função undo
      () => {
        const index = this.videos.indexOf(video);
        if (index !== -1) {
          this.videos.splice(index, 1);
        }
      }
    );
    
    // Executa a ação
    this.videos.push(video);
  }

  removeVideo(index) {
    if (index >= 0 && index < this.videos.length) {
      const removedVideo = this.videos[index];
      
      // Cria uma ação que pode ser desfeita
      this.history.addAction(
        // Função execute
        () => {
          this.videos.splice(index, 1);
        },
        // Função undo
        () => {
          this.videos.splice(index, 0, removedVideo);
        }
      );
      
      // Executa a ação
      this.videos.splice(index, 1);
    }
  }

  setCurrentSecond(second) {
    this.currentSecond = second;
  }

  listVideos() {
    return this.videos;
  }

  // Métodos para controle do histórico
  undo() {
    this.history.undo();
  }

  redo() {
    this.history.redo();
  }
}