export default class Image {
    constructor({filePath, name, xResolution, yResolution, size, blob, url, duration = 5}) {
        this.filePath = filePath;
        this.name = name;
        this.xResolution = xResolution;
        this.yResolution = yResolution;
        this.duration = duration;
        this.size = size;
        this.blob = blob;
        this.url = url;
    }
}