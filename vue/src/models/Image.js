export default class Image {
    constructor({filePath, name, size, blob, url, duration = 5, startTime = 0, endTime = null}) {
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