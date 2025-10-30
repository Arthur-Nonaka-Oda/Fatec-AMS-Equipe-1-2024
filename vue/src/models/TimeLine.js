import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";
import { TimelineHistory } from "./TimelineHistory";

export default class TimeLine {
  constructor() {
    this.layers = [{ head: null, end: null }, { head: null, end: null }, { head: null, end: null }];
    this.currentSecond = 0;
    this.executeCommand = this.executeCommand.bind(this);
    this.projectId = null;
    this.projectName = null;
    this.createdAt = null;
    this.history = new TimelineHistory(3); // Limite de 3 undos
    
    // Salva o estado inicial vazio como currentState
    this.history.currentState = this.history.createSnapshot({
      layers: this.layers,
      currentSecond: this.currentSecond,
      projectId: this.projectId,
      projectName: this.projectName,
      createdAt: this.createdAt
    });
  }

  setLayers(layers) {
    console.log('Atualizando camadas da timeline:', layers);
    try {
      // Converte o formato do store para o formato da timeline
      this.layers = layers.map(layer => {
        const items = layer.items || [];
        const nodes = items.map(item => this.createNode({ 
          file: item, 
          type: item.constructor.name.toLowerCase() 
        }));

        // Cria a lista encadeada
        let head = null;
        let end = null;
        nodes.forEach(node => {
          if (!head) {
            head = node;
            end = node;
          } else {
            end.next = node;
            end = node;
          }
        });

        return { head, end };
      });

      // Atualiza a visualização
      this.updateVueLayers();
      console.log('Camadas atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar camadas:', error);
    }
  }

  executeCommand(command) {
    if (!command || typeof command !== 'object') {
      console.error('Comando inválido:', command);
      return;
    }

    if (typeof command.execute !== 'function') {
      console.error('Comando deve ter método execute:', command);
      return;
    }
    
    try {
      console.log('Executando comando:', command);
      command.execute();
      console.log('Comando executado com sucesso');
      
      // Salva o estado DEPOIS de executar o comando
      this.saveToHistory();
    } catch (error) {
      console.error('Erro ao executar comando:', error);
    }
  }

  /**
   * Salva o estado atual da timeline no histórico
   */
  saveToHistory() {
    const currentState = {
      layers: this.layers,
      currentSecond: this.currentSecond,
      projectId: this.projectId,
      projectName: this.projectName,
      createdAt: this.createdAt
    };
    
    this.history.saveState(currentState);
  }

  /**
   * Desfaz a última ação (Control+Z)
   */
  undo() {
    const previousState = this.history.undo();
    
    if (previousState) {
      this.restoreState(previousState);
      console.log('✓ Undo aplicado com sucesso');
    }
  }

  /**
   * Refaz a última ação desfeita (Control+Shift+Z)
   */
  redo() {
    const nextState = this.history.redo();
    
    if (nextState) {
      this.restoreState(nextState);
      console.log('✓ Redo aplicado com sucesso');
    }
  }

  /**
   * Restaura um estado completo da timeline
   */
  restoreState(state) {
    this.layers = state.layers;
    this.currentSecond = state.currentSecond;
    this.projectId = state.projectId;
    this.projectName = state.projectName;
    this.createdAt = state.createdAt;
    
    // Atualiza a visualização
    this.updateVueLayers();
  }

  /**
   * Obtém informações sobre o histórico
   */
  getHistoryInfo() {
    return this.history.getInfo();
  }

  // Versão interna que não salva snapshot (para uso em comandos compostos)
  _addFileToLayerInternal(fileData, position = 'end') {
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
      this.updateVueLayers();
    }
  }

  addFileToLayer(fileData, position = 'end') {
    const execute = () => {
      this._addFileToLayerInternal(fileData, position);
    };
    
    this.executeCommand({ execute });
  }

  // Atualizar outros métodos para usar executeCommand...
  moveItem(sourceLayerIndex, sourceIndex, targetLayerIndex, targetIndex) {
    const execute = () => {
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
    this.updateVueLayers();
    };

    this.executeCommand({ execute });
  }

  // Método para atualizar as camadas no Vue
  updateVueLayers() {
    if (this.updateLayersCallback) {
      this.updateLayersCallback(this.getLayersForVue());
    }
  }

  // Registrar callback para atualização do Vue
  registerUpdateLayers(callback) {
    this.updateLayersCallback = callback;
  }

  addLayer() {
    this.layers.push({ head: null, end: null });
  }

  removeLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
    }
  }

  // Versão interna que não salva snapshot (para uso em comandos compostos)
  _removeFileFromLayerInternal(fileData) {
    if (fileData.layerIndex >= 0 && fileData.layerIndex < this.layers.length) {
      const layer = this.layers[fileData.layerIndex];
      if (layer.head !== null) {
        let current = layer.head;
        let before = null;

        // Se for o primeiro item da lista
        if (current.item === fileData.file) {
          layer.head = current.next;
          if (layer.end === current) {
            layer.end = null;
          }
          this.updateVueLayers();
          return;
        }

        // Procura o item na lista
        while (current !== null) {
          if (current.item === fileData.file) {
            if (layer.end === current) {
              layer.end = before;
            }
            if (before !== null) {
              before.next = current.next;
            }
            this.updateVueLayers();
            return;
          }
          before = current;
          current = current.next;
        }
      }
    }
  }

  removeFileFromLayer(fileData) {
    const execute = () => {
      this._removeFileFromLayerInternal(fileData);
    };

    this.executeCommand({ execute });
  }

  exportToJSON() {
    const data = {
      id: this.projectId || Math.floor(Date.now() / 1000).toString(),
      name: this.projectName || `Projeto ${new Date().toLocaleDateString()}`,
      createdAt: this.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), // Sempre atualiza o timestamp de modificação
      layers: this.layers.map((layer, index) => ({
        files: this.listFilesInLayer(index).map((file) => ({
          type: file.constructor.name.toLowerCase(),
          data: file
        }))
      })),
      currentSecond: this.currentSecond
    };

    return JSON.stringify(data, null, 2);
  }

  async saveProject(projectName = null) {
    try {
      const projectData = JSON.parse(this.exportToJSON());

      // Se já existe um projectId, usar ele para atualizar o projeto existente
      if (this.projectId) {
        projectData.id = this.projectId;
        projectData.updatedAt = new Date().toISOString(); // Adiciona timestamp de atualização
        console.log(`Atualizando projeto existente com ID: ${this.projectId}`);
      } else {
        // Se não existe projectId, criar um novo projeto
        if (projectName) {
          projectData.name = projectName;
          this.projectName = projectName;
        }
        console.log("Criando novo projeto...");
      }

      const projectId = await window.electron.saveProject(projectData);

      // Se era um projeto novo, salvar o ID retornado
      if (!this.projectId) {
        this.projectId = projectId;
      }

      console.log(`Projeto salvo com ID: ${projectId}`);
      return projectId;

    } catch (error) {
      console.error("Erro ao salvar o projeto:", error);
      throw error;
    }
  }

  async loadProject(projectId = null) {
    try {
      let parsedData;

      if (projectId && window.electron && window.electron.loadProject) {
        // Carregar projeto específico via Electron
        parsedData = await window.electron.loadProject(projectId);
        this.projectId = projectId; // Define o ID do projeto carregado
      }
      
      // Restaurar dados do projeto
      this.projectName = parsedData.name;
      this.createdAt = parsedData.createdAt;
      this.layers = parsedData.layers.map(() => ({
        head: null,
        end: null,
      }));

      for (const layer of parsedData.layers) {
        const layerIndex = parsedData.layers.indexOf(layer);
        for (const { type, data } of layer.files) {
          // Se o arquivo tem blobBase64, converter de volta para blob
          if (data.blobBase64) {
            try {
              console.log(`Processando blobBase64 para ${data.name}`);
              
              // Extrair apenas a parte base64 da string data URL
              let base64Data = data.blobBase64;
              if (base64Data.includes('base64,')) {
                base64Data = base64Data.split('base64,')[1];
              }
              
              // Decodificar base64 para blob
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Determinar o tipo MIME baseado na extensão do arquivo
              let mimeType = 'application/octet-stream';
              if (data.name) {
                const extension = data.name.split('.').pop().toLowerCase();
                switch (extension) {
                  case 'mp4':
                    mimeType = 'video/mp4';
                    break;
                  case 'webm':
                    mimeType = 'video/webm';
                    break;
                  case 'mov':
                    mimeType = 'video/quicktime';
                    break;
                  case 'avi':
                    mimeType = 'video/x-msvideo';
                    break;
                  case 'mp3':
                    mimeType = 'audio/mpeg';
                    break;
                  case 'wav':
                    mimeType = 'audio/wav';
                    break;
                  case 'png':
                    mimeType = 'image/png';
                    break;
                  case 'jpg':
                  case 'jpeg':
                    mimeType = 'image/jpeg';
                    break;
                }
              }
              
              // Criar novo blob
              data.blob = new Blob([bytes], { type: mimeType });
              
              // Se for um vídeo, gerar thumbnail para o url
              if (type === 'video') {
                data.url = await this.generateVideoThumbnail(data.blob, data.duration);
              } else {
                data.url = URL.createObjectURL(data.blob);
              }
              
              // Remover o blobBase64 para economizar memória
              delete data.blobBase64;
              
              console.log(`✓ Blob restaurado para ${data.name}: blob criado com sucesso`);
              console.log(`✓ URL gerada: ${data.url ? 'Sim' : 'Não'}`);
            } catch (error) {
              console.error(`✗ Erro ao restaurar blob para ${data.name}:`, error);
            }
          }
          
          this.addFileToLayer({ file: data, type, layerIndex });
        }
      }

      // Sempre resetar o tempo para 0 quando carregar um projeto
      this.currentSecond = 0;
      console.log(`Projeto carregado! ID: ${this.projectId} - Tempo resetado para 0`);

    } catch (error) {
      console.error("Erro ao carregar o projeto:", error);
      throw error;
    }
  }


  listFilesInLayer(layerIndex) {
    if (layerIndex >= 0 && layerIndex < this.layers.length) {
      let files = [];
      let current = this.layers[layerIndex].head;
      while (current !== null) {
        files.push(current.item);
        current = current.next;
      }
      return files;
    }
    return [];
  }

  setCurrentSecond(second) {
    this.currentSecond = second;
  }

  createNode({ file, type }) {
    switch (type) {
      case "video":
        return new Node(new Video(file));
      case "audio":
        return new Node(new Audio(file));
      case "image":
        return new Node(new Image(file));
    }
  }

  async splitVideoAtTime(video, splitTime) {
    const command = new SplitCommand(this, video, splitTime, this.layers.findIndex(layer =>
      this.listFilesInLayer(this.layers.indexOf(layer)).includes(video)
    ));
    this.executeCommand({ execute: () => command.execute() });
  }

  async splitAudioAtTime(audio, splitTime) {
    const execute = () => {
      const start = audio.startTime || 0;
      const end = audio.endTime || audio.duration;

      if (splitTime <= start || splitTime >= end) {
        console.error("Tempo de divisão inválido.");
        return;
      }

      const segment1Duration = splitTime - start;
      const segment2Duration = end - splitTime;

      const audioPart1 = new Audio({
        ...audio,
        name: audio.name + " (Parte 1)",
        duration: segment1Duration,
        startTime: start,
        endTime: splitTime,
      });

      const audioPart2 = new Audio({
        ...audio,
        name: audio.name + " (Parte 2)",
        duration: segment2Duration,
        startTime: splitTime,
        endTime: end,
      });

      const layerIndex = this.layers.findIndex(layer =>
        this.listFilesInLayer(this.layers.indexOf(layer)).includes(audio)
      );

      const originalIndex = this.listFilesInLayer(layerIndex).indexOf(audio);
      
      // Usa versões internas para não salvar snapshot múltiplas vezes
      this._removeFileFromLayerInternal({ file: audio, layerIndex });
      this._addFileToLayerInternal({ file: audioPart1, type: "audio", layerIndex }, originalIndex);
      this._addFileToLayerInternal({ file: audioPart2, type: "audio", layerIndex }, originalIndex + 1);
    };

    this.executeCommand({ execute });
  }

  async splitImageAtTime(image, splitTime) {
    const execute = () => {
      const start = image.startTime || 0;
      const end = image.endTime || image.duration;

      if (splitTime <= start || splitTime >= end) {
        console.error("Tempo de divisão inválido para imagem.");
        return;
      }

      const segment1Duration = splitTime - start;
      const segment2Duration = end - splitTime;

      const imagePart1 = {
        ...image,
        name: image.name + " (Parte 1)",
        duration: segment1Duration,
        startTime: start,
        endTime: splitTime,
      };

      const imagePart2 = {
        ...image,
        name: image.name + " (Parte 2)",
        duration: segment2Duration,
        startTime: splitTime,
        endTime: end,
      };

      const layerIndex = this.layers.findIndex(layer =>
        this.listFilesInLayer(this.layers.indexOf(layer)).includes(image)
      );

      const filesInLayer = this.listFilesInLayer(layerIndex);
      const originalIndex = filesInLayer.indexOf(image);

      if (originalIndex === -1) {
        console.error("Imagem original não encontrada na camada.");
        return;
      }

      // Usa versões internas para não salvar snapshot múltiplas vezes
      this._removeFileFromLayerInternal({ file: image, layerIndex });
      this._addFileToLayerInternal({ file: imagePart1, type: "image", layerIndex }, originalIndex);
      this._addFileToLayerInternal({ file: imagePart2, type: "image", layerIndex }, originalIndex + 1);
    };

    this.executeCommand({ execute });
  }

  getCumulativeDurationBeforeVideo(layerIndex, video) {
    if (layerIndex < 0 || layerIndex >= this.layers.length) return 0;

    const layer = this.layers[layerIndex];
    let current = layer.head;
    let cumulativeDuration = 0;

    while (current !== null) {
      if (current.item === video) return cumulativeDuration;
      cumulativeDuration += current.item.duration;
      current = current.next;
    }

    return 0;
  }

  getLayersForVue() {
    return this.layers.map(layer => ({
      items: this.listFilesInLayer(this.layers.indexOf(layer))
    }));
  }
}

class SplitCommand {
  constructor(timeline, item, splitTime, layerIndex) {
    this.timeline = timeline;
    this.item = item;
    this.splitTime = splitTime;
    this.layerIndex = layerIndex;
  }

  execute() {
    const video = this.item;
    const start = video.startTime || 0;
    const end = video.endTime || video.duration;

    if (this.splitTime <= start || this.splitTime >= end) {
      console.error("Tempo de divisão inválido.");
      return;
    }

    const segment1Duration = this.splitTime - start;
    const segment2Duration = end - this.splitTime;

    const videoPart1 = new Video({
      ...video,
      name: video.name + " (Parte 1)",
      duration: segment1Duration,
      startTime: start,
      endTime: this.splitTime,
    });

    const videoPart2 = new Video({
      ...video,
      name: video.name + " (Parte 2)",
      duration: segment2Duration,
      startTime: this.splitTime,
      endTime: end,
    });

    const filesInLayer = this.timeline.listFilesInLayer(this.layerIndex);
    const originalIndex = filesInLayer.indexOf(video);

    if (originalIndex === -1) {
      console.error("Vídeo original não encontrado na camada.");
      return;
    }

    // Usa versões internas para não salvar snapshot múltiplas vezes
    this.timeline._removeFileFromLayerInternal({ file: video, layerIndex: this.layerIndex });
    this.timeline._addFileToLayerInternal({ file: videoPart1, type: "video", layerIndex: this.layerIndex }, originalIndex);
    this.timeline._addFileToLayerInternal({ file: videoPart2, type: "video", layerIndex: this.layerIndex }, originalIndex + 1);
  }
}
