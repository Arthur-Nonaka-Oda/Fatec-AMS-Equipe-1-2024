export default class Audio {
  constructor({
    filePath,
    name,
    duration,
    size,
    blob,
    startTime = 0,
    endTime = null,
  }) {
    this.filePath = filePath;
    this.name = name;
    this.duration = duration;
    this.size = size;
    this.blob = blob;
    this.startTime = startTime;
    this.endTime = endTime || duration;
    this.volume = 1.0;
  }
}
