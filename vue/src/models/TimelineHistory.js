// TimelineHistory.js
export class TimelineHistory {
    constructor(maxStackSize = 100) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
        this.isExecutingAction = false;
    }

    // Adicione estas propriedades computadas
    get canUndo() {
        return this.undoStack.length > 0;
    }

    get canRedo() {
        return this.redoStack.length > 0;
    }

    addAction(execute, undo) {
        if (this.isExecutingAction) return;

        this.redoStack = []; // Limpa o stack de redo
        if (this.undoStack.length >= this.maxStackSize) {
            this.undoStack.shift();
        }
        
        this.undoStack.push({ execute, undo });
    }

    async undo() {
        if (this.isExecutingAction || !this.canUndo) return;
        
        try {
            this.isExecutingAction = true;
            const action = this.undoStack.pop();
            if (action && action.undo) {
                await action.undo();
                this.redoStack.push(action);
            }
        } catch (error) {
            console.error('Erro ao desfazer ação:', error);
        } finally {
            this.isExecutingAction = false;
        }
    }

    async redo() {
        if (this.isExecutingAction || !this.canRedo) return;
        
        try {
            this.isExecutingAction = true;
            const action = this.redoStack.pop();
            if (action && action.execute) {
                await action.execute();
                this.undoStack.push(action);
            }
        } catch (error) {
            console.error('Erro ao refazer ação:', error);
        } finally {
            this.isExecutingAction = false;
        }
    }
}