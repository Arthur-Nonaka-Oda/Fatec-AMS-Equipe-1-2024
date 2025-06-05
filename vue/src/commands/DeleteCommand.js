export class DeleteCommand {
  constructor(timeline, item, layerIndex) {
    this.timeline = timeline;
    this.item = item;
    this.layerIndex = layerIndex;
    this.originalState = this.timeline.getSnapshot();
  }

  execute() {
    this.timeline.removeFileFromLayer({
      file: this.item,
      layerIndex: this.layerIndex
    });
  }

  undo() {
    this.timeline.restoreSnapshot(this.originalState);
    this.timeline.updateVueLayers();
  }
}