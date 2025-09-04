
export class TimelineHistory {
    constructor(maxStackSize = 100) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = maxStackSize;
        this.isExecutingAction = false;
    }

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
        if (this.isExecutingAction || !this.canUndo) {
            console.log('Não é possível desfazer: isExecutingAction=', this.isExecutingAction, 'canUndo=', this.canUndo);
            return;
        }
        
            const action = this.undoStack.pop();
        
        try {
            this.isExecutingAction = true;
            
            if (action && action.undo) {
                console.log('Executando undo...');
                await action.undo();
                this.redoStack.push(action);
                console.log('Undo executado com sucesso');
            } else {
                console.warn('Ação de undo inválida:', action);
            }
        } catch (error) {
            console.error('Erro ao desfazer ação:', error);
            // Tentar restaurar o estado anterior
            this.undoStack.push(action);
        } finally {
            this.isExecutingAction = false;
        }
    }

    async redo() {
        if (this.isExecutingAction || !this.canRedo) {
            console.log('Não é possível refazer: isExecutingAction=', this.isExecutingAction, 'canRedo=', this.canRedo);
            return;
        }
        
            const action = this.undoStack.pop();
        
        try {
            this.isExecutingAction = true;
            
            if (action && action.execute) {
                console.log('Executando redo...');
                await action.execute();
                this.undoStack.push(action);
                console.log('Redo executado com sucesso');
            } else {
                console.warn('Ação de redo inválida:', action);
            }
        } catch (error) {
            console.error('Erro ao refazer ação:', error);
            // Tentar restaurar o estado anterior
            this.redoStack.push(action);
        } finally {
            this.isExecutingAction = false;
        }
    }
}