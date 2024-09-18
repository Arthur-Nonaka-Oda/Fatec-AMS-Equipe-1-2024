export default class Image {
    constructor({filePath, name, xResolution, yResolution, size, blob}) {
        this.filePath = filePath;
        this.name = name;
        this.xResolution = xResolution;
        this.yResolution = yResolution;
        this.size = size;
        this.blob = blob;
    }
}