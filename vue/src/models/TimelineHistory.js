import Video from './Video.js';
import Audio from './Audio.js';
import Image from './Image.js';

/**
 * TimelineHistory - Gerencia o histórico de undo/redo da timeline
 * Usa estrutura de pilha (stack) para armazenar até 3 estados
 */
export class TimelineHistory {
  constructor(maxHistorySize = 3) {
    this.undoStack = []; // Pilha de estados para undo (máximo 3)
    this.redoStack = []; // Pilha de estados para redo
    this.maxHistorySize = maxHistorySize;
    this.currentState = null; // Estado atual da timeline
  }

  /**
   * Salva o estado completo da timeline no histórico
   * @param {Object} timelineState - Estado completo da timeline {layers, currentSecond, projectId, etc}
   */
  saveState(timelineState) {
    console.log('🎯 saveState() CHAMADO');
    
    // Se já existe um estado atual, move para a pilha de undo
    if (this.currentState !== null) {
      console.log('📝 Movendo estado atual para undo stack');
      this.undoStack.push(this.currentState);
      
      // Limita a pilha de undo a 3 estados (remove o mais antigo)
      if (this.undoStack.length > this.maxHistorySize) {
        console.log('🗑️ Removendo estado mais antigo (limite atingido)');
        this.undoStack.shift(); // Remove o primeiro (mais antigo)
      }
    }

    // O novo estado vira o estado atual
    this.currentState = this.createSnapshot(timelineState);
    
    // Limpa a pilha de redo (nova ação invalida o histórico de redo)
    this.redoStack = [];

    console.log(`✓ Estado salvo. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}, Current: ${this.currentState ? 'Sim' : 'Não'}`);
  }

  /**
   * Desfaz a última ação (Control+Z)
   * @returns {Object|null} Estado anterior da timeline ou null se não houver
   */
  undo() {
    if (!this.canUndo()) {
      console.log('⚠ Não há estados anteriores para desfazer');
      return null;
    }

    // Move o estado atual para a pilha de redo
    this.redoStack.push(this.currentState);
    
    // Pega o último estado da pilha de undo
    this.currentState = this.undoStack.pop();
    
    console.log(`↶ Undo executado. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
    
    // Retorna uma cópia do estado para restaurar
    return this.restoreSnapshot(this.currentState);
  }

  /**
   * Refaz a última ação desfeita (Control+Shift+Z ou Control+Y)
   * @returns {Object|null} Próximo estado da timeline ou null se não houver
   */
  redo() {
    if (!this.canRedo()) {
      console.log('⚠ Não há estados futuros para refazer');
      return null;
    }

    // Move o estado atual para a pilha de undo
    this.undoStack.push(this.currentState);
    
    // Pega o último estado da pilha de redo
    this.currentState = this.redoStack.pop();
    
    console.log(`↷ Redo executado. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
    
    // Retorna uma cópia do estado para restaurar
    return this.restoreSnapshot(this.currentState);
  }

  /**
   * Verifica se é possível desfazer
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Verifica se é possível refazer
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Limpa todo o histórico
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.currentState = null;
    console.log('✓ Histórico limpo');
  }

  /**
   * Cria um snapshot (cópia profunda) do estado da timeline
   * @param {Object} timelineState
   * @returns {Object}
   */
  createSnapshot(timelineState) {
    const snapshot = {
      layers: this.cloneLayers(timelineState.layers),
      currentSecond: timelineState.currentSecond,
      projectId: timelineState.projectId,
      projectName: timelineState.projectName,
      createdAt: timelineState.createdAt,
      timestamp: Date.now() // Marca quando o snapshot foi criado
    };
    
    // Log para debug: conta quantos itens há em cada camada
    const itemCounts = snapshot.layers.map(layer => this.countItemsInLayer(layer));
    console.log(`📸 Snapshot criado: ${itemCounts.join(', ')} itens por camada`);
    
    return snapshot;
  }

  /**
   * Conta quantos itens há em uma camada (lista encadeada)
   */
  countItemsInLayer(layer) {
    let count = 0;
    let current = layer.head;
    while (current) {
      count++;
      current = current.next;
    }
    return count;
  }

  /**
   * Clona as camadas da timeline (estrutura de lista encadeada)
   * @param {Array} layers
   * @returns {Array}
   */
  cloneLayers(layers) {
    return layers.map(layer => {
      if (!layer.head) {
        return { head: null, end: null };
      }

      // Clona toda a lista encadeada da camada
      const clonedNodes = [];
      let current = layer.head;
      
      while (current) {
        clonedNodes.push(this.cloneNode(current));
        current = current.next;
      }

      // Reconstrói a lista encadeada
      for (let i = 0; i < clonedNodes.length - 1; i++) {
        clonedNodes[i].next = clonedNodes[i + 1];
      }

      return {
        head: clonedNodes[0] || null,
        end: clonedNodes[clonedNodes.length - 1] || null
      };
    });
  }

  /**
   * Clona um nó individual da lista encadeada
   * @param {Object} node
   * @returns {Object}
   */
  cloneNode(node) {
    return {
      item: this.cloneItem(node.item),
      next: null // Será definido depois na reconstrução da lista
    };
  }

  /**
   * Clona um item (video, audio, image)
   * Recria a instância da classe apropriada para manter os métodos
   * @param {Object} item
   * @returns {Object}
   */
  cloneItem(item) {
    let cloned;
    
    // Detecta o tipo pelo constructor.name (funciona mesmo após serialização)
    const typeName = item.constructor?.name;
    
    // Verifica também pelo blob.type se disponível
    const blobType = item.blob?.type || '';
    const isVideoBlob = blobType.startsWith('video/');
    const isAudioBlob = blobType.startsWith('audio/');
    const isImageBlob = blobType.startsWith('image/');
    
    if (item instanceof Video || typeName === 'Video' || isVideoBlob) {
      // É um vídeo - recria como instância de Video
      cloned = new Video({
        filePath: item.filePath,
        blobPath: item.blobPath,
        name: item.name,
        duration: item.duration,
        size: item.size,
        blob: item.blob, // Blob é mantido por referência (imutável)
        url: item.url,
        startTime: item.startTime,
        endTime: item.endTime
      });
      cloned.volume = item.volume !== undefined ? item.volume : 1.0;
    } 
    else if (item instanceof Audio || typeName === 'Audio' || isAudioBlob) {
      // É um áudio - recria como instância de Audio
      cloned = new Audio({
        filePath: item.filePath,
        blobPath: item.blobPath,
        name: item.name,
        duration: item.duration,
        size: item.size,
        blob: item.blob,
        url: item.url,
        startTime: item.startTime,
        endTime: item.endTime
      });
      cloned.volume = item.volume !== undefined ? item.volume : 1.0;
    } 
    else if (item instanceof Image || typeName === 'Image' || isImageBlob) {
      // É uma imagem - recria como instância de Image
      cloned = new Image({
        filePath: item.filePath,
        blobPath: item.blobPath,
        name: item.name,
        duration: item.duration,
        size: item.size,
        blob: item.blob,
        url: item.url,
        startTime: item.startTime,
        endTime: item.endTime
      });
    }
    else {
      // Fallback: clona como objeto simples
      console.warn('⚠️ Tipo de item desconhecido ao clonar:', typeName, item);
      cloned = { ...item };
      if (item.blob instanceof Blob) {
        cloned.blob = item.blob;
      }
    }

    return cloned;
  }

  /**
   * Restaura um snapshot (prepara para uso)
   * @param {Object} snapshot
   * @returns {Object}
   */
  restoreSnapshot(snapshot) {
    console.log('🔄 Restaurando snapshot...');
    const restored = {
      layers: this.cloneLayers(snapshot.layers),
      currentSecond: snapshot.currentSecond,
      projectId: snapshot.projectId,
      projectName: snapshot.projectName,
      createdAt: snapshot.createdAt
    };
    
    // Verifica se os itens foram recriados como instâncias corretas
    restored.layers.forEach((layer, index) => {
      let current = layer.head;
      let itemCount = 0;
      while (current) {
        itemCount++;
        const itemType = current.item?.constructor?.name || 'unknown';
        console.log(`  Layer ${index}, Item ${itemCount}: ${itemType} (${current.item?.name})`);
        current = current.next;
      }
    });
    
    return restored;
  }

  /**
   * Obtém informações sobre o estado do histórico
   * @returns {Object}
   */
  getInfo() {
    return {
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      maxSize: this.maxHistorySize,
      hasCurrentState: this.currentState !== null,
      undoStates: this.undoStack.map((state, index) => ({
        index,
        timestamp: state.timestamp,
        projectName: state.projectName
      })),
      redoStates: this.redoStack.map((state, index) => ({
        index,
        timestamp: state.timestamp,
        projectName: state.projectName
      }))
    };
  }
}