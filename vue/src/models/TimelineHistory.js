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

    // Método auxiliar para recarregar blobs de vídeo
    async reloadVideoBlob(video) {
        if (!video.filePath) return;
        
        try {
            // Tenta carregar via fetch primeiro
            const response = await fetch(`file://${video.filePath}`);
            if (response.ok) {
                const blob = await response.blob();
                if (blob.size > 0) {
                    video.blob = blob;
                    video.url = URL.createObjectURL(blob);
                    return;
                }
            }

            // Se fetch falhar, tenta via electron
            if (window.electron && window.electron.ipcRenderer) {
                const base64Data = await window.electron.ipcRenderer.invoke('load-video-file', { filePath: video.filePath });
                if (base64Data) {
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'video/mp4' });
                    if (blob.size > 0) {
                        video.blob = blob;
                        video.url = URL.createObjectURL(blob);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao recarregar blob:', error);
        }
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
            
            // Notifica o início da operação de undo
            if (window.timeline && window.timeline.updateVueLayers) {
                window.timeline.updateVueLayers();
            
            if (!action || typeof action.undo !== 'function') {
                console.warn('Ação de undo inválida:', action);
                return;
            }

            // Prepara a função de undo com tratamento especial para blobs
            const wrappedUndo = async () => {
                // Primeiro tentamos executar a função undo normalmente
                await action.undo();
                
                // Depois verificamos se há vídeos que precisam ter seus blobs restaurados
                const timeline = window.timeline;
                if (timeline) {
                    // Força atualização antes de processar os blobs
                    timeline.updateVueLayers();
                    
                    const layers = timeline.layers;
                    layers.forEach(layer => {
                        let current = layer.head;
                        while (current) {
                            if (current.item && current.item.type === 'video') {
                                const video = current.item;
                                
                                // Se o vídeo tem um filePath mas não tem blob, tenta recarregar
                                if (video.filePath && (!video.blob || !(video.blob instanceof Blob))) {
                                    console.log('Recarregando blob para:', video.name);
                                    this.reloadVideoBlob(video);
                                }
                            }
                            current = current.next;
                        }
                    });
                    
                    // Força outra atualização após processar os blobs
                    timeline.updateVueLayers();
            };

            // Executa o undo com o tratamento especial
            await wrappedUndo();
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
            
            await action.execute();
            
            // Verifica e restaura os blobs dos vídeos
            const timeline = window.timeline;
            if (timeline) {
                // Força atualização antes de processar os blobs
                timeline.updateVueLayers();
                
                const layers = timeline.layers;
                for (const layer of layers) {
                    let current = layer.head;
                    while (current) {
                        if (current.item && current.item.type === 'video') {
                            const video = current.item;
                            if (!video.blob || !(video.blob instanceof Blob)) {
                                console.log('Restaurando blob para:', video.name);
                                await this.reloadVideoBlob(video);
                            }
                        }
                        current = current.next;
                    }
                }
                
                // Força outra atualização após processar os blobs
                timeline.updateVueLayers();

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