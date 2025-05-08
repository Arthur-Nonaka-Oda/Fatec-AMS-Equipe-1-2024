export default class Video {
    constructor({ filePath, name, duration, size, blob, url, startTime = 0, endTime = null }) {
        this.filePath = filePath;
        this.name = name;
        this.duration = duration;
        this.size = size;
        this.blob = blob;
        this.url = url;
        this.startTime = startTime;
        this.endTime = endTime || duration;
        this.volume = 1.0;
    }
}