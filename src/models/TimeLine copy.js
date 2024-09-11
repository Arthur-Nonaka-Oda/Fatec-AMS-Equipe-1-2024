import Video from "../models/Video";

export default class TimeLine{
  constructor() {
    this.videos = [];
    this.currentSecond = 0;
  }

  addVideo(videoData) {
    const video = new Video(videoData);
    this.videos.push(video);
  }

  addVideoToEnd(fileData) {
    const file = new Video(fileData);
    this.files.push(file);
  }

  setCurrentSecond(second) {
    this.currentSecond = second;
  }

  removeVideo(index) {
    if (index >= 0 && index < this.videos.length) {
      this.videos.splice(index, 1);
    }
  }

  listVideos() {
    return this.videos;
  }
}