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
    updateTimeline(layers, skipHistory = false) {
      if (!layers || !Array.isArray(layers)) {
        console.warn('Tentativa de atualizar timeline com layers inválidas');
        return;
      }

      try {
        // Primeiro, salvamos o estado atual no histórico se necessário
        if (!skipHistory) {
          const currentState = {
            layers: this.layers.map(layer => ({
              items: layer.items.map(item => ({
                ...item,
                id: item.id,
                type: item.type,
                name: item.name,
                path: item.path,
                duration: item.duration,
                volume: item.volume || 1.0,
                start: item.start || 0,
                end: item.end,
                file: item.file,
                blob: item.blob,
                src: item.src,
                sourceUrl: item.sourceUrl,
                url: item.url,
                // Preservar dados específicos
                videoSpecificData: item.videoSpecificData,
                audioSpecificData: item.audioSpecificData,
                imageSpecificData: item.imageSpecificData
              }))
            })),
            currentSecond: this.currentSecond
          };

          // Verifica se o estado é válido antes de salvar
          if (currentState.layers.every(layer => Array.isArray(layer.items))) {
            this.history.past.push(currentState);
            this.history.future = [];
            console.log('Estado salvo no histórico. Total:', this.history.past.length);
          }
        }

        // Depois, atualizamos cada camada garantindo que os items são instâncias corretas
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
          'Items:', totalItems,
          'Histórico:', this.history.past.length
        );
      } catch (error) {
        console.error('Erro ao atualizar timeline:', error);
      }
    },

    saveState() {
      try {
        const currentState = {
          layers: this.layers.map(layer => ({
            items: layer.items.map(item => {
              // Garantir que todos os dados necessários sejam salvos
              const savedItem = {
                ...item,
                id: item.id,
                type: item.type,
                name: item.name,
                path: item.path,
                duration: item.duration,
                volume: item.volume || 1.0,
                start: item.start || 0,
                end: item.end,
                file: item.file,
                blob: item.blob,
                src: item.src,
                sourceUrl: item.sourceUrl,
                url: item.url,
                // Dados específicos por tipo
                ...(item.type === 'video' && { videoSpecificData: item.videoSpecificData }),
                ...(item.type === 'audio' && { audioSpecificData: item.audioSpecificData }),
                ...(item.type === 'image' && { imageSpecificData: item.imageSpecificData })
              };

              // Log para debug
              console.log(`Salvando item ${savedItem.name}:`, {
                id: savedItem.id,
                type: savedItem.type,
                hasUrl: !!savedItem.url,
                hasBlob: !!savedItem.blob,
                hasSrc: !!savedItem.src
              });

              return savedItem;
            })
          })),
          currentSecond: this.currentSecond
        };

        // Verifica se o estado é diferente do último
        const lastState = this.history.past[this.history.past.length - 1];
        const stateChanged = !lastState || 
          JSON.stringify(lastState.layers) !== JSON.stringify(currentState.layers) ||
          lastState.currentSecond !== currentState.currentSecond;

        if (stateChanged) {
          // Limita o tamanho do histórico
          if (this.history.past.length > 30) {
            this.history.past = this.history.past.slice(-30);
          }
          
          this.history.past.push(currentState);
          this.history.future = [];
          
          console.log('Novo estado salvo. Total no histórico:', this.history.past.length);
        }
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }
    },

    restoreState(state) {
      if (!state) {
        console.warn('Tentativa de restaurar estado nulo');
        return;
      }

      try {
        console.log('Iniciando restauração de estado:', state);

        // Primeiro, verificamos se o estado é válido
        if (!state.layers || !Array.isArray(state.layers)) {
          console.error('Estado inválido para restauração:', state);
          return;
        }

        // Criamos novas camadas com arrays vazios
        const newLayers = state.layers.map(() => ({ items: [] }));

        // Para cada camada no estado
        state.layers.forEach((layerState, layerIndex) => {
          if (!Array.isArray(layerState.items)) {
            console.warn(`Camada ${layerIndex} não tem items válidos`);
            return;
          }

          console.log(`Processando camada ${layerIndex}:`, layerState.items.length, 'items');

          // Para cada item na camada
          layerState.items.forEach(itemData => {
            if (!itemData || !itemData.type) {
              console.warn('Item inválido encontrado:', itemData);
              return;
            }

            try {
              // Preparar dados completos do item
              const itemWithData = {
                ...itemData,
                id: itemData.id,
                type: itemData.type,
                name: itemData.name,
                path: itemData.path,
                duration: itemData.duration,
                volume: itemData.volume || 1.0,
                start: itemData.start || 0,
                end: itemData.end,
                file: itemData.file,
                blob: itemData.blob,
                src: itemData.src,
                url: itemData.url,
                sourceUrl: itemData.sourceUrl || itemData.path,
                videoSpecificData: itemData.videoSpecificData,
                audioSpecificData: itemData.audioSpecificData,
                imageSpecificData: itemData.imageSpecificData
              };

              // Criamos uma nova instância do item usando o método existente
              const newItem = this.createTypedItem({
                file: itemWithData,
                type: itemData.type
              });

              if (newItem) {
                // Log para debug
                console.log(`Item restaurado: ${newItem.name}`, {
                  id: newItem.id,
                  type: newItem.type,
                  hasUrl: !!newItem.url,
                  hasBlob: !!newItem.blob,
                  hasSrc: !!newItem.src
                });
                
                // Adicionamos o item à nova camada
                newLayers[layerIndex].items.push(newItem);
              }
            } catch (itemError) {
              console.error('Erro ao restaurar item:', itemError);
            }
          });
        });

        // Atualizamos o state usando $patch para forçar atualização
        this.$patch((patchState) => {
          patchState.layers = newLayers;
          patchState.currentSecond = state.currentSecond || 0;
        });

        console.log('Estado restaurado:', 
          'Camadas:', this.layers.length,
          'Total de items:', this.layers.reduce((sum, l) => sum + l.items.length, 0)
        );
      } catch (error) {
        console.error('Erro ao restaurar estado:', error);
      }
    },

    undo() {
      if (this.history.past.length === 0) {
        console.log('Sem histórico para desfazer');
        return;
      }

      try {
        // Obtemos o último estado do histórico
        const previousState = this.history.past[this.history.past.length - 1];
        
        // Salvamos o estado atual antes de desfazer
        const currentState = {
          layers: this.layers.map(layer => ({
            items: layer.items.map(item => {
              // Criamos uma cópia profunda do item com todos os dados necessários
              return {
                id: item.id,
                type: item.type,
                name: item.name,
                path: item.path,
                duration: item.duration,
                volume: item.volume || 1.0,
                start: item.start || 0,
                end: item.end,
                file: item.file,
                blob: item.blob,
                src: item.src,
                sourceUrl: item.sourceUrl,
                url: item.url,
                // Preservar dados específicos por tipo
                videoSpecificData: item.videoSpecificData,
                audioSpecificData: item.audioSpecificData,
                imageSpecificData: item.imageSpecificData
              };
            })
          })),
          currentSecond: this.currentSecond
        };

        // Remove o estado do passado e adiciona ao futuro
        this.history.past.pop();
        this.history.future.unshift(currentState);

        console.log('Restaurando estado anterior:', previousState);

        // Recriamos cada item do estado anterior
        const restoredLayers = previousState.layers.map(layer => ({
          items: layer.items.map(itemData => {
            // Garantir que temos todos os dados necessários antes de recriar o item
            const itemWithData = {
              ...itemData,
              id: itemData.id,
              type: itemData.type,
              name: itemData.name,
              path: itemData.path,
              duration: itemData.duration,
              start: itemData.start || 0,
              end: itemData.end,
              volume: itemData.volume || 1.0,
              blob: itemData.blob,
              src: itemData.src,
              url: itemData.url,
              sourceUrl: itemData.sourceUrl || itemData.path
            };

            const newItem = this.createTypedItem({
              file: itemWithData,
              type: itemData.type
            });

            if (!newItem) {
              console.error('Falha ao recriar item:', itemData);
              return null;
            }

            return newItem;
          }).filter(Boolean) // Remove itens nulos
        }));

        // Atualizamos o estado usando $patch para garantir reatividade
        this.$patch((state) => {
          state.layers = restoredLayers;
          state.currentSecond = previousState.currentSecond;
        });

        console.log('Ação desfeita:', 
          'Items:', this.layers.reduce((sum, l) => sum + l.items.length, 0),
          'Histórico restante:', this.history.past.length,
          'Ações futuras:', this.history.future.length
        );
      } catch (error) {
        console.error('Erro ao desfazer ação:', error);
      }
    },

    redo() {
      if (this.history.future.length === 0) {
        console.log('Sem ações para refazer');
        return;
      }

      try {
        // Obtemos o próximo estado do futuro
        const nextState = this.history.future[0];
        
        // Salvamos o estado atual antes de refazer
        const currentState = {
          layers: this.layers.map(layer => ({
            items: layer.items.map(item => {
              // Criamos uma cópia profunda do item com todos os dados necessários
              return {
                id: item.id,
                type: item.type,
                name: item.name,
                path: item.path,
                duration: item.duration,
                volume: item.volume || 1.0,
                start: item.start || 0,
                end: item.end,
                file: item.file,
                blob: item.blob,
                src: item.src,
                sourceUrl: item.sourceUrl,
                url: item.url,
                // Preservar dados específicos por tipo
                videoSpecificData: item.videoSpecificData,
                audioSpecificData: item.audioSpecificData,
                imageSpecificData: item.imageSpecificData
              };
            })
          })),
          currentSecond: this.currentSecond
        };

        // Remove o estado do futuro e adiciona ao passado
        this.history.future.shift();
        this.history.past.push(currentState);

        console.log('Restaurando próximo estado:', nextState);

        // Recriamos cada item do próximo estado
        const restoredLayers = nextState.layers.map(layer => ({
          items: layer.items.map(itemData => {
            // Garantir que temos todos os dados necessários antes de recriar o item
            const itemWithData = {
              ...itemData,
              id: itemData.id,
              type: itemData.type,
              name: itemData.name,
              path: itemData.path,
              duration: itemData.duration,
              start: itemData.start || 0,
              end: itemData.end,
              volume: itemData.volume || 1.0,
              blob: itemData.blob,
              src: itemData.src,
              url: itemData.url,
              sourceUrl: itemData.sourceUrl || itemData.path
            };

            const newItem = this.createTypedItem({
              file: itemWithData,
              type: itemData.type
            });

            if (!newItem) {
              console.error('Falha ao recriar item:', itemData);
              return null;
            }

            return newItem;
          }).filter(Boolean) // Remove itens nulos
        }));

        // Atualizamos o estado usando $patch para garantir reatividade
        this.$patch((state) => {
          state.layers = restoredLayers;
          state.currentSecond = nextState.currentSecond;
        });

        console.log('Ação refeita:', 
          'Items:', this.layers.reduce((sum, l) => sum + l.items.length, 0),
          'Histórico restante:', this.history.past.length,
          'Ações futuras restantes:', this.history.future.length
        );
      } catch (error) {
        console.error('Erro ao refazer ação:', error);
      }
    },

    addFileToLayer(fileData, position = 'end') {
      this.saveState();
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
      this.saveState();
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
      this.saveState();
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
    },

    restoreItemMethods(itemData) {
      if (!itemData || !itemData.type) return null;

      // Criamos uma nova instância do zero
      const restoredItem = this.createTypedItem({
        file: {
          ...itemData,
          id: itemData.id,
          name: itemData.name,
          path: itemData.path,
          start: itemData.start || 0,
          end: itemData.end,
          duration: itemData.duration,
          volume: itemData.volume || 1.0,
          videoSpecificData: itemData.videoSpecificData,
          audioSpecificData: itemData.audioSpecificData,
          imageSpecificData: itemData.imageSpecificData
        },
        type: itemData.type
      });

      return restoredItem;
    }
  }
});