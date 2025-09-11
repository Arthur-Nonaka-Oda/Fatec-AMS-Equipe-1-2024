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
        
        // Cria uma cópia limpa das funções
        const cleanExecute = async () => {
            try {
                await execute();
            } catch (error) {
                console.error('Erro na execução:', error);
                throw error;
            }
        };
        
        const cleanUndo = async () => {
            try {
                await undo();
            } catch (error) {
                console.error('Erro no undo:', error);
                throw error;
            }
        };
        
        this.undoStack.push({ 
            execute: cleanExecute, 
            undo: cleanUndo,
            timestamp: Date.now() 
        });
    }

    async undo() {
        if (this.isExecutingAction || !this.canUndo) {
            console.log('Não é possível desfazer: isExecutingAction=', this.isExecutingAction, 'canUndo=', this.canUndo);
            return;
        }
        
        const action = this.undoStack.pop();
        
        try {
            this.isExecutingAction = true;
            
            if (!action || typeof action.undo !== 'function') {
                console.warn('Ação de undo inválida:', action);
                return;
            }

            console.log('Iniciando undo...');
            
            // Preserva os blobs antes de limpar o estado
            const preservedBlobs = new Map();
            
            if (action.previousState) {
                const traverse = (obj) => {
                    if (!obj) return;
                    if (obj.blob instanceof Blob) {
                        preservedBlobs.set(obj.url, obj.blob);
                    }
                    if (typeof obj === 'object') {
                        Object.values(obj).forEach(traverse);
                    }
                };
                
                // Preserva os blobs
                traverse(action.previousState);
                
                // Limpa o estado de propriedades reativas
                const cleanState = JSON.parse(JSON.stringify(action.previousState));
                
                // Restaura os blobs
                const restoreBlobs = (obj) => {
                    if (!obj) return;
                    if (obj.url && preservedBlobs.has(obj.url)) {
                        obj.blob = preservedBlobs.get(obj.url);
                    }
                    if (typeof obj === 'object') {
                        Object.values(obj).forEach(restoreBlobs);
                    }
                };
                
                restoreBlobs(cleanState);
                action.previousState = cleanState;
            }
            
            await action.undo();
            this.redoStack.push(action);
            console.log('Undo executado com sucesso');
            
        } catch (error) {
            console.error('Erro ao desfazer ação:', error);
            this.undoStack.push(action);
        } finally {
            this.isExecutingAction = false;
        }
    }
    
    // Método auxiliar para encontrar vídeos em um estado
    findVideosInState(state) {
        const videos = [];
        if (state && state.layers) {
            for (const layer of state.layers) {
                let current = layer.head;
                while (current) {
                    if (current.item && current.item.type === 'video') {
                        videos.push(current.item);
                    }
                    current = current.next;
                }
            }
        }
        return videos;
    }

    async redo() {
        if (this.isExecutingAction || !this.canRedo) {
            console.log('Não é possível refazer: isExecutingAction=', this.isExecutingAction, 'canRedo=', this.canRedo);
            return;
        }

        const action = this.redoStack.pop();

        try {
            this.isExecutingAction = true;

            if (!action || typeof action.execute !== 'function') {
                console.warn('Ação de redo inválida:', action);
                return;
            }

            console.log('Iniciando redo...');
            
            // Preserva os blobs antes de limpar o estado
            const preservedBlobs = new Map();
            
            if (action.previousState) {
                const traverse = (obj) => {
                    if (!obj) return;
                    if (obj.blob instanceof Blob) {
                        preservedBlobs.set(obj.url, obj.blob.slice(0));
                    }
                    if (typeof obj === 'object') {
                        Object.values(obj).forEach(traverse);
                    }
                };
                
                // Preserva os blobs
                traverse(action.previousState);
                
                // Limpa o estado de propriedades reativas
                const cleanState = JSON.parse(JSON.stringify(action.previousState));
                
                // Restaura os blobs
                const restoreBlobs = (obj) => {
                    if (!obj) return;
                    if (obj.url && preservedBlobs.has(obj.url)) {
                        obj.blob = preservedBlobs.get(obj.url);
                    }
                    if (typeof obj === 'object') {
                        Object.values(obj).forEach(restoreBlobs);
                    }
                };
                
                restoreBlobs(cleanState);
                action.previousState = cleanState;
            }
            
            await action.execute();
            this.undoStack.push(action);
            console.log('Redo executado com sucesso');
            
        } catch (error) {
            console.error('Erro ao refazer ação:', error);
            this.redoStack.push(action);
        } finally {
            this.isExecutingAction = false;
        }
    }
}