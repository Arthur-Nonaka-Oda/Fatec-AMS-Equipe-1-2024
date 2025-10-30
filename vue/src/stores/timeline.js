import { defineStore } from 'pinia';
import Video from '../models/Video';
import Audio from '../models/Audio';
import Image from '../models/Image';

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    layers: [{ items: [] }, { items: [] }, { items: [] }],
    currentSecond: 0,
    projectId: null,
    projectName: null,
    createdAt: null
  }),

  getters: {
    getLayersForVue: (state) => state.layers,
  },

  actions: {
    updateTimeline(layers) {
      if (!layers || !Array.isArray(layers)) {
        console.warn('Tentativa de atualizar timeline com layers inválidas');
        return;
      }

      try {
        // Atualizamos cada camada garantindo que os items são instâncias corretas
        const newLayers = layers.map(layer => {
          if (!Array.isArray(layer.items)) {
            console.warn('Layer sem items array encontrada');
            return { items: [] };
          }

          const newItems = layer.items
            .filter(item => {
              if (!item || !item.type || !item.path) {
                console.warn('Item inválido filtrado:', item);
                return false;
              }
              return true;
            })
            .map(item => {
              if (!item.type) {
                console.warn('Item sem tipo encontrado:', item);
                return null;
              }

              // Se já é uma instância válida e tem todos os dados necessários, mantém
              if (
                (item instanceof Video && item.type === 'video') ||
                (item instanceof Audio && item.type === 'audio') ||
                (item instanceof Image && item.type === 'image')
              ) {
                return item;
              }

              // Caso contrário, cria uma nova instância
              try {
                const ItemClass = item.type === 'video' ? Video :
                                item.type === 'audio' ? Audio :
                                item.type === 'image' ? Image : null;

                if (!ItemClass) {
                  console.warn('Tipo de item inválido:', item.type);
                  return null;
                }

                return new ItemClass({
                  ...item,
                  id: item.id || crypto.randomUUID(),
                  volume: item.volume || 1.0,
                  start: item.start || 0
                });
              } catch (error) {
                console.error('Erro ao criar item:', error);
                return null;
              }
            })
            .filter(Boolean); // Remove items nulos

          return { items: newItems };
        });

        // Atualizamos o state usando $patch para forçar atualização
        this.$patch((state) => {
          state.layers = newLayers;
          if (layers.currentSecond !== undefined) {
            state.currentSecond = layers.currentSecond;
          }
        });

        // Log para debug
        const totalItems = this.layers.reduce((sum, l) => sum + l.items.length, 0);
        console.log(
          'Timeline atualizada -',
          'Camadas:', this.layers.length,
          'Items:', totalItems
        );
      } catch (error) {
        console.error('Erro ao atualizar timeline:', error);
      }
    },

    addFileToLayer(fileData, position = 'end') {
      const layerIndex = fileData.layerIndex;
      
      if (layerIndex >= 0 && layerIndex < this.layers.length) {
        // Cria uma nova instância do item
        const newItem = this.createTypedItem(fileData);
        const layer = this.layers[layerIndex];
        
        if (!Array.isArray(layer.items)) {
          layer.items = [];
        }
        
        // Adiciona o item na posição correta
        if (position === 'start') {
          layer.items.unshift(newItem);
        } else if (position === 'end') {
          layer.items.push(newItem);
        } else if (typeof position === 'number') {
          layer.items.splice(position, 0, newItem);
        }
        
        // Atualiza a timeline com o novo estado
        this.updateTimeline(this.layers);
        console.log('Item adicionado e timeline atualizada');
      }
    },

    removeFileFromLayer(fileData) {
      const layerIndex = fileData.layerIndex;
      if (layerIndex >= 0 && layerIndex < this.layers.length) {
        const layer = this.layers[layerIndex];
        if (!Array.isArray(layer.items)) return;
        
        // Encontra o item para remover
        const idx = layer.items.findIndex(it => 
          it === fileData.file || 
          it.id === fileData.file?.id || 
          it.name === fileData.file?.name
        );
        
        if (idx !== -1) {
          // Remove apenas o item específico
          layer.items.splice(idx, 1);
          
          // Atualiza a timeline com o novo estado
          this.updateTimeline(this.layers);
          console.log('Item removido e timeline atualizada');
        }
      }
    },

    moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
      const sourceLayer = this.layers[sourceLayerIndex];
      const targetLayer = this.layers[targetLayerIndex];
      
      if (!sourceLayer || !targetLayer) return;
      if (!Array.isArray(sourceLayer.items) || sourceLayer.items.length <= sourceIndex) return;
      
      // Move o item
      const [item] = sourceLayer.items.splice(sourceIndex, 1);
      if (targetIndex >= 0 && targetIndex <= targetLayer.items.length) {
        targetLayer.items.splice(targetIndex, 0, item);
      } else {
        targetLayer.items.push(item);
      }
      
      // Atualiza a timeline após a movimentação
      this.updateTimeline(this.layers);
      console.log('Item movido e timeline atualizada');
    },

    createTypedItem({ file, type }) {
      try {
        // Garantimos que temos todos os dados necessários
        const baseData = {
          ...file,
          type,
          id: file.id || crypto.randomUUID(),
          name: file.name,
          path: file.path,
          start: file.start || 0,
          end: file.end,
          volume: file.volume || 1.0,
          // Mantemos a referência ao arquivo original se existir
          file: file.file || file,
          // Preservamos o blob ou source se existir
          blob: file.blob,
          src: file.src,
          sourceUrl: file.sourceUrl || file.path
        };

        // Criamos uma nova instância com todos os dados
        let instance;
        switch (type) {
          case 'video':
            instance = new Video({
              ...baseData,
              duration: file.duration,
              videoSpecificData: file.videoSpecificData
            });
            break;
          case 'audio':
            instance = new Audio({
              ...baseData,
              duration: file.duration,
              audioSpecificData: file.audioSpecificData
            });
            break;
          case 'image':
            instance = new Image({
              ...baseData,
              imageSpecificData: file.imageSpecificData
            });
            break;
          default:
            return { ...baseData };
        }

        // Garantimos que temos todas as propriedades necessárias
        if (!instance.sourceUrl && instance.path) {
          instance.sourceUrl = instance.path;
        }

        // Se temos um blob, criamos uma URL para ele
        if (instance.blob && !instance.src) {
          instance.src = URL.createObjectURL(instance.blob);
        }

        console.log(`Item criado: ${type}`, {
          id: instance.id,
          name: instance.name,
          path: instance.path,
          sourceUrl: instance.sourceUrl,
          src: instance.src
        });

        return instance;
      } catch (error) {
        console.error(`Erro ao criar item do tipo ${type}:`, error);
        return null;
      }
    }
  }
});
