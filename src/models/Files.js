import Video from "./Video";

export default class Files {
    constructor() {
        this.files = [];
    }

    addFile(fileData) {
        const file = new Video(fileData);
        this.files.push(file);
    }

    removeFile(fileName) {
        this.files = this.files.filter(file => file.name !== fileName);
    }

    getFiles() {
        return this.files;
    }

}