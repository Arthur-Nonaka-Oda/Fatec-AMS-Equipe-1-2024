export default class Video {
    constructor({filePath, name, duration, size, blob}) {
        this.filePath = filePath;
        this.name = name;
        this.duration = duration;
        this.size = size;
        this.blob = blob;
    }
}