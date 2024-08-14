import Video from "./Video";

export default class TimeLine {
    constructor() {
        this.videos = [];
    }

    addVideo(videoData) {
        const video = new Video(videoData);
        this.videos.push(video);
      }
    
      removeVideo(videoName) {
        this.videos = this.videos.filter(video => video.name !== videoName);
      }
    
      listVideos() {
        return this.videos;
      }
}