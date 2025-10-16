import Video from "../models/Video";
import Audio from "./Audio";
import Image from "./Image";
import Node from "../models/Node";

export default class TimeLine {
  constructor() {
    this.layers = [{ head: null, end: null }, { head: null, end: null }, { head: null, end: null }];
    this.currentSecond = 0;
    this.executeCommand = this.executeCommand.bind(this);
    this.projectId = null;
    this.projectName = null;
    this.createdAt = null;
    this.history = {
      past: [],
      future: []
    };
  }

  // Método para atualizar as camadas da timeline com os dados do store
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

  saveToHistory() {
    const snapshot = this.getSnapshot();
    this.history.past.push(snapshot);
    this.history.future = []; // Limpa o histórico futuro ao fazer uma nova ação
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
      // Salva o estado atual no histórico antes de executar o comando
      this.saveToHistory();
      
      console.log('Executando comando:', command);
      command.execute();
      console.log('Comando executado com sucesso');
    } catch (error) {
      console.error('Erro ao executar comando:', error);
    }
  }

  addFileToLayer(fileData, position = 'end') {
    const execute = () => {
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
    };
    
    this.executeCommand({ execute });
  }

        // Correção sugerida
        getSnapshot() {
            return {
                layers: this.layers.map(layer => ({
                    head: layer.head ? this.deepCloneNode(layer.head) : null,
                    end: layer.end ? this.deepCloneNode(layer.end) : null
                })),
                currentSecond: this.currentSecond
            };
        }

        deepCloneNode(node) {
            if (!node) return null;
            
            // Clone profundo do item
            const clonedItem = JSON.parse(JSON.stringify(node.item));
            
            // Restaurar os métodos do item clonado
            this.restoreItemMethods(clonedItem);
            
            // Criar novo nó com o item restaurado
            const clonedNode = new Node(clonedItem);
            
            // Clone recursivo do próximo nó
            clonedNode.next = node.next ? this.deepCloneNode(node.next) : null;
            
            return clonedNode;
        }

// Correção para o método restoreSnapshot
restoreSnapshot(snapshot) {
    // Cria cópias profundas das camadas
    this.layers = snapshot.layers.map(layer => ({
        head: layer.head ? this.deepCloneNode(layer.head) : null,
        end: layer.end ? this.deepCloneNode(layer.end) : null
    }));
    
    // Restaurar outros estados importantes
    this.currentSecond = snapshot.currentSecond;
    
    // Garantir que todos os itens nas camadas tenham seus métodos restaurados
    this.layers.forEach(layer => {
        let current = layer.head;
        while (current) {
            if (current.item) {
                this.restoreItemMethods(current.item);
            }
            current = current.next;
        }
    });
    
    // Atualizar a visualização
    this.updateVueLayers();
}

restoreItemMethods(item) {
    if (!item) return;
    
    // Determinar o tipo do item e restaurar sua classe apropriada
    let ItemClass;
    if (item.type === 'video' || item instanceof Video) {
        ItemClass = Video;
    } else if (item.type === 'audio' || item instanceof Audio) {
        ItemClass = Audio;
    } else if (item.type === 'image' || item instanceof Image) {
        ItemClass = Image;
    }

    if (ItemClass) {
        // Preservar dados importantes
        const data = { ...item };
        
        // Recriar o objeto com a classe correta
        Object.setPrototypeOf(item, ItemClass.prototype);
        
        // Restaurar todos os dados
        Object.assign(item, new ItemClass(data));
    }

    // Garantir que o volume seja restaurado
    if (typeof item.volume === 'undefined') {
        item.volume = 1.0;
    }
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

  removeFileFromLayer(fileData) {
    const execute = () => {
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
    this.removeFileFromLayer({ file: audio, layerIndex });
    this.addFileToLayer({ file: audioPart1, type: "audio", layerIndex }, originalIndex);
    this.addFileToLayer({ file: audioPart2, type: "audio", layerIndex }, originalIndex + 1);
  }

  async splitImageAtTime(image, splitTime) {
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

    this.removeFileFromLayer({ file: image, layerIndex });
    this.addFileToLayer({ file: imagePart1, type: "image", layerIndex }, originalIndex);
    this.addFileToLayer({ file: imagePart2, type: "image", layerIndex }, originalIndex + 1);
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

    this.timeline.removeFileFromLayer({ file: video, layerIndex: this.layerIndex });
    this.timeline.addFileToLayer({ file: videoPart1, type: "video", layerIndex: this.layerIndex }, originalIndex);
    this.timeline.addFileToLayer({ file: videoPart2, type: "video", layerIndex: this.layerIndex }, originalIndex + 1);
  }
}
