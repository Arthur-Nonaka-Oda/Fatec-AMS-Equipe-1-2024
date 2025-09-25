/* eslint-disable */
<template>
  <div>
    
    <header>
      <div v-if="isLoading" class="loading-modal-overlay">
        <div class="loading-modal-content">
          <p class="loading-message">{{ loadingMessage }}</p>

          <div class="circular-progress-display">
            <svg class="progress-ring" width="120" height="120">
              <circle class="progress-ring-bg" stroke="#e0e0e0" stroke-width="8" fill="transparent" r="52" cx="60"
                cy="60" />
              <circle class="progress-ring-fg" stroke="#4CAF50" stroke-width="8" fill="transparent" r="52" cx="60"
                cy="60" :style="{ 'stroke-dasharray': circumference, 'stroke-dashoffset': strokeDashoffset }" />
            </svg>
            <p class="progress-text-centered">{{ progressPercentage }}%</p>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <button @click="cancelLoading" class="cancel-button">Cancelar</button>
        </div>
      </div>
      <div class="barra-superior">
        <div class="esquerda" id="importButtons">
          <FileUpload />
          <!-- <button class="btn-acao" data-acao="texto" aria-label="Adicionar Texto" @click="openTextEditor">
            <img src="/textoIcone.png" alt="Texto" />
            <span class="legenda">Texto</span>
          </button> -->
          <button @click="renderizeVideo" class="btn-acao" data-acao="salvar" aria-label="Salvar">
            <img src="/export.png" alt="Salvar" />
            <span class="legenda">Exportar</span>
          </button>
          
          <!-- Card do nome do projeto -->
          <div class="project-name-card">
            <span class="project-name">
              {{ currentProjectName }}
            </span>
          </div>

          <div v-if="isTextEditorOpen" class="modal">
            <div class="modal-content">
              <button class="close-button" @click="closeTextEditor">X</button>
              <!-- Conteúdo do TextEditor -->
              <TextEditor />
            </div>
          </div>
        </div>
        <div class="centro">

          <button @click="saveProject" class="btn-acao" data-acao="salvar" aria-label="Salvar" :class="{ 'unsaved-changes': hasUnsavedChanges }">
            <img src="/salvarIcone.png" alt="Salvar" />
            <span class="legenda">{{ hasUnsavedChanges ? 'Salvar*' : 'Salvar' }}</span>
          </button>
          <button @click="loadProject" class="btn-acao" data-acao="carregar" aria-label="Carregar">
            <img src="/carregar.png" alt="Carregar" />
            <span class="legenda">Carregar</span>
          </button>
        </div>
        <div class="direita" id="recordButtons">
          <button class="btn-acao" id="startButton" data-acao="gravar" @click="toggleRecording" aria-label="Gravar">
            <img id="imagePlay" :src="recordImageSrc" alt="Gravar" />
            <span id="textPlay" class="legenda">{{
              isRecording ? "Parar" : "Gravar"
            }}</span>
          </button>
          <button :disabled="!isRecording" class="btn-acao" id="pauseButton" @click="pauseRecording"
            :style="{ opacity: isRecording ? 1 : 0.5 }" data-acao="pause" aria-label="Pause">
            <img :src="pauseImageSrc" alt="Pause" />
            <span class="legenda">{{ isPaused ? "Retomar" : "Pausar" }}</span>
          </button>
        </div>
      </div>
    </header>

    <section class="secao-principal">
      <div class="area-visualizacao">
        <div class="esquerda">
          <MediaTabs @add-file="handleFileAdded" />
        </div>
        <VideoPreview ref="videoPreview" :timeline="timeline" @delete-video="handleDeleteVideo"
          @trim-video="handleTrimVideo" @update-time="handleUpdateTime" />
      </div>
      <TimeLine ref="timeline" @item-clicked="handleItemClicked" :projects="projects" :selected-item="selectedItem" :timeline="timeline"
        :layers="layers" :update-layers="updateLayers" :current-time="currentGlobalTime"
        @cursor-moved="handleCursorMoved" @update-item-volume="handleUpdateItemVolume" 
        @timeline-changed="markAsUnsaved" />
    </section>
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Projetos</h2>
        <div class="projects-content">
          <button v-for="project in projects" :key="project" @click="selectProject(project.id)" class="project-btn">
            {{ project.name }}
          </button>
        </div>
        <button @click="showModal = false" class="close-btn">Fechar</button>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div v-if="showConfirmationModal" class="modal-overlay">
      <div class="confirmation-modal-content">
        <h2>Confirmar Mudança de Projeto</h2>
        <p>Você tem alterações não salvas no projeto atual. Tem certeza de que deseja carregar outro projeto?</p>
        <p><strong>Todas as alterações não salvas serão perdidas.</strong></p>
        <div class="confirmation-buttons">
          <button @click="confirmLoadProject" class="confirm-btn">Sim, carregar projeto</button>
          <button @click="cancelLoadProject" class="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal para Nome do Novo Projeto -->
    <div v-if="showNameModal" class="modal-overlay">
      <div class="name-modal-content">
        <h2>Salvar Novo Projeto</h2>
        <p>Digite um nome para o seu projeto:</p>
        <input 
          v-model="newProjectName" 
          type="text" 
          placeholder="Nome do projeto..." 
          class="project-name-input"
          @keyup.enter="saveNewProject"
          maxlength="50"
          ref="projectNameInput"
        />
        <div class="name-modal-buttons">
          <button @click="saveNewProject" class="save-btn" :disabled="!newProjectName.trim()">Salvar</button>
          <button @click="cancelNewProject" class="cancel-btn">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Seleção de Fonte de Gravação -->
    <RecordingSourceSelector 
      :showModal="showRecordingSourceModal"
      @close="showRecordingSourceModal = false"
      @recording-started="onRecordingStarted"
      @error="onRecordingError"
    />
  </div>
</template>

<script>
import FileUpload from "./components/FileUpload.vue";
import MediaTabs from "./components/MediaTabs.vue";
import TimeLineComponent from "./components/TimeLine.vue";
import TimeLine from "./models/TimeLine.js";
import VideoPreview from "./components/VideoPreview.vue";
import TextEditor from "./components/TextEditor.vue";
import RecordingSourceSelector from "./components/RecordingSourceSelector.vue";
import Video from "./models/Video"; // Certifique-se de que o caminho está correto
import Audio from "./models/Audio"; // Certifique-se de que o caminho está correto
import Image from "./models/Image";
import "./assets/main.css";

export default {
  name: "App",
  components: {
    FileUpload,
    MediaTabs,
    TextEditor,
    RecordingSourceSelector,
    TimeLine: TimeLineComponent,
    VideoPreview,
  },
  data() {
    return {
      videoUrl: null,
      isRecording: false,
      isPaused: false,
      selectedItem: { item: null },
      recordImageSrc: "/gravarIcone.png",
      pauseImageSrc: "/pauseIcone.png",
      timeline: null,
      isTextEditorOpen: false,
      layers: [],
      startTime: null, // Tempo de início do corte
      duration: 10, // Duração do corte
      videoFilePath: null, // Novo atributo para armazenar o caminho real do arquivo
      cursorTimeInSeconds: 0, // Armazena o tempo do cursor
      isLoading: false,
      currentGlobalTime: 0,
      progressPercentage: 0,
      loadingMessage: 'Carregando...',
      showModal:false,
      projects: [],
      showConfirmationModal: false,
      selectedProjectId: null,
      hasUnsavedChanges: false,
      showNameModal: false,
      newProjectName: '',
      currentProjectName: 'Novo Projeto',
      showRecordingSourceModal: false,
    };
  },
  computed: {
    circumference() {
      // Raio do círculo agora é 52 (r="52" no SVG)
      return 2 * Math.PI * 52;
    },
    strokeDashoffset() {
      return this.circumference - (this.progressPercentage / 100) * this.circumference;
    }
  },
  created() {
    this.timeline = new TimeLine();
    this.layers = this.timeline.getLayersForVue();

    window.addEventListener("keydown", this.handleKeyDown);
    window.electron.ipcRenderer.on('render-progress', (percent) => { //Listener para o progresso da renderização
      this.updateProgress(percent);
    });
  },
  beforeDestroy() {
    // Remove o listener quando o componente é destruído
    window.removeEventListener("keydown", this.handleKeyDown);
    // Importante: Remover o listener IPC quando o componente é destruído
    window.electron.ipcRenderer.removeListener('renderize-progress', this.updateProgress);
  },
  methods: {
    handleUpdateItemVolume(payload) {
      if (payload && payload.item) {
        payload.item.volume = payload.volume;
        this.updateLayers();
        this.$refs.videoPreview.updateVolume();
        // Marca que há alterações não salvas quando altera volume
        this.hasUnsavedChanges = true;
      }
    },
    async saveProject() {
      try {
        const isNewProject = !this.timeline.projectId;
        
        if (isNewProject) {
          // Se é um novo projeto, abre modal para nome
          this.showNameModal = true;
          // Aguarda um pouco para o modal renderizar e então foca no input
          this.$nextTick(() => {
            if (this.$refs.projectNameInput) {
              this.$refs.projectNameInput.focus();
            }
          });
          return;
        }
        
        // Se já tem ID, salva diretamente
        const projectId = await this.timeline.saveProject();
        console.log("Projeto atualizado:", projectId);
        
        // Marca que não há alterações não salvas após salvar
        this.hasUnsavedChanges = false;
      } catch (error) {
        console.error("Erro ao salvar o projeto:", error);
      }
    },
    async saveNewProject() {
      if (!this.newProjectName.trim()) {
        alert('Por favor, insira um nome para o projeto.');
        return;
      }
      
      try {
        const projectId = await this.timeline.saveProject(this.newProjectName.trim());
        console.log("Novo projeto criado com ID:", projectId);
        
        // Salva o nome antes de limpar a variável
        const savedProjectName = this.newProjectName.trim();
        
        // Marca que não há alterações não salvas após salvar
        this.hasUnsavedChanges = false;
        this.showNameModal = false;
        this.newProjectName = '';
        this.currentProjectName = savedProjectName;
      } catch (error) {
        console.error("Erro ao salvar o projeto:", error);
      }
    },
    cancelNewProject() {
      this.showNameModal = false;
      this.newProjectName = '';
    },
    async loadProject() {
      try {
        const result = await window.electron.ipcRenderer.invoke('get-projects');
        this.projects = result;
        this.showModal = true;

      } catch (error) {
        console.error("Erro ao carregar o projeto:", error);
      }
    },
    async selectProject(projectId) {
      // Verifica se há alterações não salvas
      const hasCurrentProject = this.layers.some(layer => layer.items.length > 0);
      
      if (hasCurrentProject && this.hasUnsavedChanges) {
        this.selectedProjectId = projectId;
        this.showConfirmationModal = true;
      } else {
        this.loadSelectedProject(projectId);
      }
    },
    async loadSelectedProject(projectId) {
      try {
        await this.timeline.loadProject(projectId);
        this.updateLayers();
        console.log("Projeto carregado:", projectId);
        this.showModal = false;
        this.showConfirmationModal = false;
        this.selectedProjectId = null;
        // Marca que não há alterações não salvas após carregar um projeto
        this.hasUnsavedChanges = false;
        // Atualiza o nome do projeto atual
        this.currentProjectName = this.timeline.projectName || `Projeto ${projectId}`;
      } catch (error) {
        console.error("Erro ao carregar o projeto:", error);
        this.showModal = false;
        this.showConfirmationModal = false;
        this.selectedProjectId = null;
      }
    },
    confirmLoadProject() {
      this.loadSelectedProject(this.selectedProjectId);
    },
    cancelLoadProject() {
      this.showConfirmationModal = false;
      this.selectedProjectId = null;
    },
    markAsUnsaved() {
      // Método para marcar que há alterações não salvas
      this.hasUnsavedChanges = true;
    },
    updateLayers(newLayers) {
      this.layers = newLayers || this.timeline.getLayersForVue();

      const hasItems = this.layers.some((layer) => layer.items.length > 0);
      if (hasItems) {
        // this.createVideoFromBlobs(); // Removido ou comentado aqui, pois pode causar carregamentos indesejados
      } else {
        this.videoUrl = `data:video/mp4;base64,${""}`;
      }
    },

    // --- NOVOS MÉTODOS PARA O MODAL DE CARREGAMENTO ---
    startLoading(message = 'Carregando...') {
      this.isLoading = true;
      this.progressPercentage = 0;
      this.loadingMessage = message;
      // Se você tiver uma API que emita progresso, você a iniciaria aqui
      // Ex: window.electron.ipcRenderer.on('renderize-progress', (event, percentage) => {
      //   this.updateProgress(percentage);
      // });
    },
    updateProgress(percentage) {
      if (percentage >= 0 && percentage <= 100) {
        this.progressPercentage = Math.floor(percentage); // Garante número inteiro
      }
    },
    finishLoading(message = 'Concluído!') {
      this.isLoading = false;
      this.progressPercentage = 100;
      this.loadingMessage = message;
    },
    cancelLoading() {
      if (confirm('Tem certeza que deseja cancelar esta operação?')) {
        window.electron.ipcRenderer.send('cancel-renderization');

        this.isLoading = false;
        this.progressPercentage = 0;
        this.loadingMessage = 'Operação cancelada!';
      }
    },


    async renderizeVideo() {
      this.startLoading('Renderizando vídeo...'); // Inicia o modal de carregamento
      const videos = this.layers[0].items.map(video => ({
        filePath: video.filePath,
        blobPath: video.blobPath, // Caminho do blob salvo no projeto
        projectId: this.timeline?.projectId, // ID do projeto atual
        name: video.name,
        startTime: video.startTime,
        endTime: video.endTime,
        volume: video.volume || 1,
      }));
      const audios = this.layers[1].items.map(audio => ({
        filePath: audio.filePath,
        blobPath: audio.blobPath, // Caminho do blob salvo no projeto
        projectId: this.timeline?.projectId, // ID do projeto atual
        name: audio.name,
        startTime: audio.startTime,
        endTime: audio.endTime,
        volume: audio.volume || 1,
      }));

      console.log('Enviando para renderização:', { videos, audios });

      try {
        await window.electron.ipcRenderer.invoke("renderize", {
          videos,
          audios,
        });
      } finally {
        this.finishLoading();
      }
    },

    async toggleRecording() {
      try {
        if (!this.isRecording) {
          // Mostra o modal de seleção de fonte de gravação
          console.log("Abrindo modal de seleção de fonte...");
          this.showRecordingSourceModal = true;
        } else {
          // Parando gravação
          console.log("Parando gravação...");
          
          // Verificar se há gravação ativa no sistema novo
          if (window.currentRecording) {
            await window.currentRecording.stop();
            window.currentRecording = null;
          } else {
            // Fallback para o sistema antigo
            await window.electron.recorder().stopRecording();
          }
          
          this.isRecording = false;
          this.recordImageSrc = "/gravarIcone.png";
          console.log("Gravação parada com sucesso");
        }
      } catch (error) {
        console.error("Erro durante gravação:", error);
        
        // Restaura o estado em caso de erro
        this.isRecording = false;
        this.recordImageSrc = "/gravarIcone.png";
        
        // Mostra uma mensagem de erro para o usuário
        alert(`Erro ao ${this.isRecording ? 'parar' : 'iniciar'} gravação: ${error.message || 'Erro desconhecido'}`);
      }
    },

    // Callback quando a gravação é iniciada através do modal
    onRecordingStarted(sourceConfig) {
      console.log("Gravação iniciada com configuração:", sourceConfig);
      this.isRecording = true;
      this.recordImageSrc = "/pararIcone.png";
    },

    // Callback para erros do modal de gravação
    onRecordingError(errorMessage) {
      console.error("Erro no modal de gravação:", errorMessage);
      alert(errorMessage);
    },
    pauseRecording() {
      this.isPaused = !this.isPaused;
      this.pauseImageSrc = this.isPaused
        ? "/gravarIcone.png"
        : "/pauseIcone.png";
    },
    handleFileAdded(fileData) {
      this.timeline.addFileToLayer(fileData);
      this.updateLayers();
      // Marca que há alterações não salvas quando adiciona arquivo
      this.hasUnsavedChanges = true;
    },
    handleItemClicked(item) {
      this.selectedItem = this.selectedItem === item ? null : item;
    },
    openTextEditor() {
      this.isTextEditorOpen = true;
    },
    closeTextEditor() {
      this.isTextEditorOpen = false;
    },
     handleDeleteVideo() {
      this.timeline.removeFileFromLayer({
        file: this.selectedItem.item,
        layerIndex: this.selectedItem.layerIndex,
      });
      console.log("delete");
      console.log(this.timeline.listFilesInLayer(0));
      console.log(this.timeline.listFilesInLayer(1));
      console.log(this.timeline.listFilesInLayer(2));
      this.updateLayers();
      // Marca que há alterações não salvas quando remove arquivo
      this.hasUnsavedChanges = true;
      
      // Se todas as camadas ficaram vazias, reseta o nome do projeto
      const hasAnyItems = this.layers.some(layer => layer.items.length > 0);
      if (!hasAnyItems && !this.timeline.projectId) {
        this.currentProjectName = 'Novo Projeto';
        this.hasUnsavedChanges = false;
      }

      
  // Garante que o cursor volte para o início após atualizar as camadas
  this.$nextTick(() => {
    this.currentGlobalTime = 0;
    // Atualiza o cursor visual na timeline e no preview
    this.$refs.timeline.updateCurrentTime(0);
    this.$refs.videoPreview.updateCurrentTime(0);
  });
},
    handleKeyDown(event) {
      if (event.key === "Delete") {
        this.handleDeleteVideo();
      }
    },
    handleTrimVideo() {
      const selectedItem = this.selectedItem.item;
      const layerIndex = this.selectedItem.layerIndex;

      if (!selectedItem) {
        alert("Nenhum item selecionado para recortar.");
        return;
      }

      const cumulativeDuration = this.timeline.getCumulativeDurationBeforeVideo(layerIndex, selectedItem);
      const splitPointInTimeline = this.currentGlobalTime - cumulativeDuration;

      if (splitPointInTimeline <= 0 || splitPointInTimeline >= selectedItem.duration) {
        alert("Posicione o cursor dentro do item para dividir.");
        return;
      }

      const splitPointInOriginal = (selectedItem.startTime || 0) + splitPointInTimeline;

      if (selectedItem instanceof Video) {
        this.timeline.splitVideoAtTime(selectedItem, splitPointInOriginal);
      } else if (selectedItem instanceof Audio) {
        this.timeline.splitAudioAtTime(selectedItem, splitPointInOriginal);
      } else if (selectedItem instanceof Image) {
        this.timeline.splitImageAtTime(selectedItem, splitPointInOriginal);
      }

      this.updateLayers();
      // Marca que há alterações não salvas quando divide arquivo
      this.hasUnsavedChanges = true;
    },
    handleCursorPosition(currentTimeInSeconds) {
      this.startTime = currentTimeInSeconds;
    },
    handleUpdateTime(currentTime) {
      this.currentGlobalTime = currentTime;
      this.$refs.timeline.updateCurrentTime(currentTime);
    },
    handleCursorMoved(currentTimeInSeconds) {
      this.currentGlobalTime = currentTimeInSeconds;
      this.$refs.videoPreview.updateCurrentTime(currentTimeInSeconds);
    },
  },
};
</script>

<style scoped>
/* Estilos para o modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  /* Fundo semitransparente */
  z-index: 1000;
  /* Coloca o modal acima de tudo */
}

/* Conteúdo do modal (TextEditor) */
.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 600px;
  height: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* Botão para fechar o modal */
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.loading-modal-overlay {
  position: fixed;
  /* Fixa o modal na tela */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  /* Fundo semi-transparente escuro */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  /* Garante que o modal esteja acima de todo o conteúdo */
}

.loading-modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  color: #333;
  min-width: 300px;
  max-width: 90%;
}

.loading-message {
  font-size: 1.2em;
  margin-bottom: 20px;
  font-weight: bold;
}

.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 20px;
  margin-bottom: 15px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50;
  /* Cor verde para o progresso */
  width: 0%;
  border-radius: 5px;
  transition: width 0.3s ease-in-out;
  /* Animação suave no progresso */
}

.progress-text {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 25px;
  color: #555;
}

/* ESTILOS PARA O CONTÊINER DO CÍRCULO E O TEXTO CENTRALIZADO */
.circular-progress-display {
  position: relative;
  /* Fundamental para posicionar o texto absoluto dentro */
  width: 120px;
  /* Largura do SVG */
  height: 120px;
  /* Altura do SVG */
  margin: 20px auto;
  /* Centraliza o container e dá espaço */
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-ring {
  transform: rotate(-90deg);
  /* Começa o preenchimento do topo */
  position: absolute;
  /* Para que o texto possa ficar por cima */
  top: 0;
  left: 0;
}

.progress-ring-bg,
.progress-ring-fg {
  transition: stroke-dashoffset 0.35s ease-out;
  /* Transição suave do preenchimento */
  transform-origin: 50% 50%;
  /* Garante que a rotação seja a partir do centro */
}

.progress-text-centered {
  /* CLASSE para o texto dentro do círculo */
  position: absolute;
  /* Use 'inset: 0' para cobrir a área do pai relativo (circular-progress-display) */
  inset: 0;
  display: flex;
  /* Use flexbox para centralizar o conteúdo do parágrafo */
  justify-content: center;
  /* Centraliza horizontalmente */
  align-items: center;
  /* Centraliza verticalmente */
  font-size: 1.8em;
  /* Mantenha o tamanho da porcentagem */
  font-weight: bold;
  color: #333;
  z-index: 1;
  /* Garante que o texto fique acima do círculo */
  /* Removidos top, left e transform, pois o flexbox fará o trabalho */
}

/* ESTILOS PARA A BARRA DE PROGRESSO (MANTIDOS DE SEU CÓDIGO ORIGINAL) */
.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  height: 20px;
  margin-top: 20px;
  /* Espaço entre o círculo e a barra */
  margin-bottom: 25px;
  /* Espaço para o botão de cancelar */
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4CAF50;
  width: 0%;
  /* Será controlado pelo Vue */
  border-radius: 5px;
  transition: width 0.3s ease-in-out;
  /* Animação suave no progresso */
}

/* Estilos do botão Cancelar (mantidos) */
.cancel-button {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #d32f2f;
}

.project-controls button {
  padding: 10px 15px;
  background-color: #323c7d;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.2s ease;
}

.project-controls button:hover {
  background-color: #4a5aa1;
}

.project-controls input[type="file"] {
  display: none;
}

.project-controls {
  position: fixed;
  bottom: 50px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 500px;
  max-height: 400px;
}

.projects-content {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
  max-height: 300px;
  overflow-y: auto;
}

.project-btn {
  display: block;
  width: max-content;
  margin: 8px 0;
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
}

.project-btn:hover,
.project-btn:focus {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.close-btn {
  margin-top: 16px;
}

/* Estilos para o modal de confirmação */
.confirmation-modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.confirmation-modal-content h2 {
  color: #d32f2f;
  margin-bottom: 20px;
  font-size: 1.4em;
}

.confirmation-modal-content p {
  margin-bottom: 15px;
  color: #333;
  line-height: 1.5;
}

.confirmation-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.confirm-btn {
  background-color: #d32f2f;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #b71c1c;
}

.cancel-btn {
  background-color: #757575;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #616161;
}

/* Indicador visual para alterações não salvas */
.btn-acao.unsaved-changes {
  position: relative;
  animation: pulse-save 2s infinite;
}

.btn-acao.unsaved-changes::after {
  content: '';
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  background-color: #ff4444;
  border-radius: 50%;
  animation: blink 1.5s infinite;
}

@keyframes pulse-save {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Estilos para o modal de nome do projeto */
.name-modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.name-modal-content h2 {
  color: #323c7d;
  margin-bottom: 15px;
  font-size: 1.4em;
}

.name-modal-content p {
  margin-bottom: 20px;
  color: #333;
  line-height: 1.5;
}

.project-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  margin-bottom: 25px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.project-name-input:focus {
  outline: none;
  border-color: #323c7d;
}

.name-modal-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Estilos para o card do nome do projeto */
.project-name-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 20px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #323c7d 0%, #4a5aa1 100%);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  min-width: 120px;
  max-width: 200px;
}

.project-label {
  font-size: 0.65em;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.project-name {
  font-size: 0.8em;
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@keyframes pulse-project-card {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes glow-project-text {
  from {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  to {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.6);
  }
}

/* Estilos para o cabeçalho do projeto */
.project-header {
  background: linear-gradient(135deg, #323c7d 0%, #4a5aa1 100%);
  padding: 15px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid #1e2a5e;
}

.project-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.8em;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.project-title.unsaved {
  color: #ffeb3b;
  animation: glow-title 2s infinite alternate;
}

@keyframes glow-title {
  from {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 235, 59, 0.5);
  }
  to {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 235, 59, 0.8), 0 0 30px rgba(255, 235, 59, 0.5);
  }
}
</style>
