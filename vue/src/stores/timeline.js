import { defineStore } from 'pinia';
import Video from '../models/Video';
import Audio from '../models/Audio';
import Image from '../models/Image';
import Node from '../models/Node';

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    layers: [{ items: [] }, { items: [] }, { items: [] }],
    currentSecond: 0,
    projectId: null,
    projectName: null,
    createdAt: null,
    history: {
      past: [],
      future: []
    }
  }),

  getters: {
    canUndo: (state) => state.history.past.length > 0,
    canRedo: (state) => state.history.future.length > 0,
    getLayersForVue: (state) => state.layers,
  },

  actions: {
    updateTimeline(newLayers) {
      console.log('Atualizando timeline com:', newLayers);
      this.saveState();
      this.layers = newLayers.map(layer => ({
        items: Array.isArray(layer.items) ? [...layer.items] : []
      }));
    },

    saveState() {
      console.log('Salvando estado atual');
      try {
        // Cria uma cópia profunda do estado atual
        const currentState = {
          layers: this.layers.map(layer => ({
            items: Array.isArray(layer.items) ? 
              layer.items.map(item => ({ ...item })) : []
          })),
          currentSecond: this.currentSecond
        };

        this.history.past.push(currentState);
        this.history.future = [];
        console.log('Estado salvo:', currentState);
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }
    },

    undo() {
      console.log('Tentando desfazer. Estados passados:', this.history.past.length);
      if (this.history.past.length > 0) {
        // Salva estado atual para redo
        const currentState = {
          layers: this.layers.map(layer => ({
            items: Array.isArray(layer.items) ? 
              layer.items.map(item => ({ ...item })) : []
          })),
          currentSecond: this.currentSecond
        };

        this.history.future.unshift(currentState);
        
        // Restaura estado anterior
        const previousState = this.history.past.pop();
        if (previousState && previousState.layers) {
          this.layers = previousState.layers.map(layer => ({
            items: Array.isArray(layer.items) ? 
              layer.items.map(item => ({ ...item })) : []
          }));
          this.currentSecond = previousState.currentSecond;
          console.log('Estado restaurado:', this.layers);
        }
      }
    },

    redo() {
      console.log('Tentando refazer. Estados futuros:', this.history.future.length);
      if (this.history.future.length > 0) {
        // Salva estado atual para undo
        const currentState = {
          layers: this.layers.map(layer => ({
            items: Array.isArray(layer.items) ? 
              layer.items.map(item => ({ ...item })) : []
          })),
          currentSecond: this.currentSecond
        };

        this.history.past.push(currentState);
        
        // Restaura próximo estado
        const nextState = this.history.future.shift();
        if (nextState && nextState.layers) {
          this.layers = nextState.layers.map(layer => ({
            items: Array.isArray(layer.items) ? 
              layer.items.map(item => ({ ...item })) : []
          }));
          this.currentSecond = nextState.currentSecond;
          console.log('Estado restaurado:', this.layers);
        }
      }
    },

  actions: {
    // Atualiza a timeline com os dados mais recentes
    updateTimeline(layers) {
      // Salva o estado atual antes de atualizar
      this.saveState();
      
      // Atualiza as camadas
      this.layers = layers.map(layer => ({
        head: this.createNodeList(layer.items),
        end: layer.items.length > 0 ? this.createNodeList(layer.items.slice(-1)) : null
      }));
    },

    // Cria uma lista encadeada de nós a partir de um array de itens
    createNodeList(items) {
      if (!items || items.length === 0) return null;
      
      let head = null;
      let current = null;
      
      items.forEach(item => {
        const node = new Node(item);
        if (!head) {
          head = node;
        } else {
          current.next = node;
        }
        current = node;
      });
      
      return head;
    },

    // Salva o estado atual no histórico
    saveState() {
      console.log('Salvando estado atual');
      try {
        const currentState = {
          layers: JSON.parse(JSON.stringify(this.layers)),
          currentSecond: this.currentSecond
        };
        
        // Verifica se o estado é válido antes de salvar
        if (!currentState.layers || !Array.isArray(currentState.layers)) {
          console.error('Estado inválido ao tentar salvar');
          return;
        }
        
        // Garante que todas as camadas tenham a propriedade items
        currentState.layers.forEach(layer => {
          if (!layer.items) layer.items = [];
        });

        this.history.past.push(currentState);
        this.history.future = []; // Limpa o histórico futuro ao fazer uma nova ação
        console.log('Estado salvo com sucesso:', currentState);
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }
    },

    // Desfaz a última ação
    undo() {
      console.log('Tentando desfazer. Estados passados:', this.history.past.length);
      if (this.history.past.length > 0) {
        const currentState = {
          layers: JSON.parse(JSON.stringify(this.layers)),
          currentSecond: this.currentSecond
        };

        this.history.future.unshift(currentState);
        const previousState = this.history.past.pop();
        this.restoreState(previousState);
        console.log('Estado restaurado:', previousState);
      }
    },

    // Refaz a última ação desfeita
    redo() {
      console.log('Tentando refazer. Estados futuros:', this.history.future.length);
      if (this.history.future.length > 0) {
        const currentState = {
          layers: JSON.parse(JSON.stringify(this.layers)),
          currentSecond: this.currentSecond
        };

        this.history.past.push(currentState);
        const nextState = this.history.future.shift();
        this.restoreState(nextState);
        console.log('Estado restaurado:', nextState);
      }
    },

    // Restaura um estado salvo
    restoreState(state) {
      console.log('Restaurando estado:', state);
      this.layers = state.layers;
      this.currentSecond = state.currentSecond;
    },

    // Clona um nó e seus filhos
    deepCloneNode(node) {
      if (!node) return null;
      
      const clonedItem = JSON.parse(JSON.stringify(node.item));
      this.restoreItemMethods(clonedItem);
      
      const clonedNode = new Node(clonedItem);
      clonedNode.next = node.next ? this.deepCloneNode(node.next) : null;
      
      return clonedNode;
    },

    // Restaura os métodos de um item
    restoreItemMethods(item) {
      if (!item) return;
      
      let ItemClass;
      if (item.type === 'video' || item instanceof Video) {
        ItemClass = Video;
      } else if (item.type === 'audio' || item instanceof Audio) {
        ItemClass = Audio;
      } else if (item.type === 'image' || item instanceof Image) {
        ItemClass = Image;
      }

      if (ItemClass) {
        const data = { ...item };
        Object.setPrototypeOf(item, ItemClass.prototype);
        Object.assign(item, new ItemClass(data));
      }

      if (typeof item.volume === 'undefined') {
        item.volume = 1.0;
      }
    },

    // Adiciona um arquivo a uma camada
    addFileToLayer(fileData, position = 'end') {
      this.saveState();

      const layerIndex = fileData.layerIndex;
      if (layerIndex >= 0 && layerIndex < this.layers.length) {
        const newNode = this.createNode(fileData);
        const layer = this.layers[layerIndex];

        if (layer.head === null) {
          layer.head = newNode;
          layer.end = newNode;
        } else if (typeof position === 'number') {
          let current = layer.head;
          let prev = null;
          let index = 0;

          while (current && index < position) {
            prev = current;
            current = current.next;
            index++;
          }

          if (prev) {
            prev.next = newNode;
            newNode.next = current;
          } else {
            newNode.next = layer.head;
            layer.head = newNode;
          }

          if (!newNode.next) {
            layer.end = newNode;
          }
        } else if (position === 'start') {
          newNode.next = layer.head;
          layer.head = newNode;
        } else if (position === 'end') {
          layer.end.next = newNode;
          layer.end = newNode;
        }
      }
    },

    // Cria um novo nó
    createNode({ file, type }) {
      switch (type) {
        case "video":
          return new Node(new Video(file));
        case "audio":
          return new Node(new Audio(file));
        case "image":
          return new Node(new Image(file));
      }
    },

    // Remove um arquivo de uma camada
    removeFileFromLayer(fileData) {
      this.saveState();

      if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
        const layer = this.layers[fileData.layerIndex];
        if (layer.head !== null) {
          let current = layer.head;
          let before = null;

          if (current.item === fileData.file) {
            layer.head = current.next;
            if (layer.end === current) {
              layer.end = null;
            }
            return;
          }

          while (current !== null) {
            if (current.item === fileData.file) {
              if (layer.end === current) {
                layer.end = before;
              }
              if (before !== null) {
                before.next = current.next;
              }
              return;
            }
            before = current;
            current = current.next;
          }
        }
      }
    },

    // Move um item
    moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
      this.saveState();

      const sourceLayer = this.layers[sourceLayerIndex];
      let current = sourceLayer.head;
      let prev = null;
      let count = 0;

      while (current && count < sourceIndex) {
        prev = current;
        current = current.next;
        count++;
      }

      if (!current) return;

      if (prev) {
        prev.next = current.next;
      } else {
        sourceLayer.head = current.next;
      }

      const targetLayer = this.layers[targetLayerIndex];
      let targetCurrent = targetLayer.head;
      let targetPrev = null;
      count = 0;

      while (targetCurrent && count < targetIndex) {
        targetPrev = targetCurrent;
        targetCurrent = targetCurrent.next;
        count++;
      }

      if (targetPrev) {
        targetPrev.next = current;
        current.next = targetCurrent;
      } else {
        current.next = targetLayer.head;
        targetLayer.head = current;
      }

      if (!current.next) {
        targetLayer.end = current;
      }
    }
  },

  getters: {
    canUndo: (state) => state.history.past.length > 0,
    canRedo: (state) => state.history.future.length > 0,
    
    getLayersForVue: (state) => state.layers,
  },
}},);