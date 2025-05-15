export class TimelineHistory {
  constructor(maxStackSize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = maxStackSize;
  }

  addAction(execute, undo) {
    // Limpa o redo stack quando uma nova ação é adicionada
    this.redoStack = [];
    
    // Mantém o tamanho máximo do undo stack
    if (this.undoStack.length >= this.maxStackSize) {
      this.undoStack.shift();
    }
    
    this.undoStack.push({ execute, undo });
  }

  undo() {
    if (this.undoStack.length > 0) {
      const action = this.undoStack.pop();
      action.undo();
      this.redoStack.push(action);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const action = this.redoStack.pop();
      action.execute();
      this.undoStack.push(action);
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}