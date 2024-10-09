import Video from "./Video";
import Image from "./Image";
import Audio from "./Audio";

export default class Files {
    constructor() {
        this.videos = [];
        this.images = [];
        this.audios = [];
    }

    addVideo(fileData) {
        const file = new Video(fileData);
        this.videos.push(file);
    }
    addImage(fileData) {
        const file = new Image(fileData);
        this.images.push(file);
    }
    addAudio(fileData) {
        const file = new Audio(fileData);
        this.audios.push(file);
    }

    removeFile(fileName) {
        this.files = this.files.filter(file => file.name !== fileName);
    }

    getFiles() {
        return {videos: this.videos, images: this.images, audios: this.audios};
    }

}