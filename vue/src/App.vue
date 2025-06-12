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
          <button class="btn-acao" data-acao="texto" aria-label="Adicionar Texto" @click="openTextEditor">
            <img src="/textoIcone.png" alt="Texto" />
            <span class="legenda">Texto</span>
          </button>

          <div v-if="isTextEditorOpen" class="modal">
            <div class="modal-content">
              <button class="close-button" @click="closeTextEditor">X</button>
              <!-- Conteúdo do TextEditor -->
              <TextEditor />
            </div>
          </div>
        </div>
        <div class="centro">
          <button class="btn-acao" data-acao="desfazer" aria-label="Desfazer">
            <img src="/voltarIcone.png" alt="Desfazer" />
            <span class="legenda">Desfazer</span>
          </button>
          <button @click="renderizeVideo" class="btn-acao" data-acao="salvar" aria-label="Salvar">
            <img src="/salvarIcone.png" alt="Salvar" />
            <span class="legenda">Salvar</span>
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
          <!-- Aqui o componente MediaTabs é adicionado -->
          <MediaTabs @add-file="handleFileAdded" />
        </div>
        <VideoPreview ref="videoPreview" :timeline="timeline" @delete-video="handleDeleteVideo"
          @trim-video="handleTrimVideo" @update-time="handleUpdateTime" />
      </div>
      <TimeLine ref="timeline" @item-clicked="handleItemClicked" :selected-item="selectedItem" :timeline="timeline"
        :layers="layers" :update-layers="updateLayers" :current-time="currentGlobalTime"
        @cursor-moved="handleCursorMoved" @update-item-volume="handleUpdateItemVolume" />
    </section>
  </div>
</template>

<script>
import FileUpload from "./components/FileUpload.vue";
import MediaTabs from "./components/MediaTabs.vue";
import TimeLineComponent from "./components/TimeLine.vue";
import TimeLine from "./models/TimeLine.js";
import VideoPreview from "./components/VideoPreview.vue";
import TextEditor from "./components/TextEditor.vue";
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
      }
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
        startTime: video.startTime,
        endTime: video.endTime,
        volume: video.volume || 1,
      }));
      const audios = this.layers[1].items.map(audio => ({
        filePath: audio.filePath,
        startTime: audio.startTime,
        endTime: audio.endTime,
        volume: audio.volume || 1,
      }));

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
      this.isRecording = !this.isRecording;
      if (this.isRecording) {
        window.electron.recorder().startRecording();
      } else {
        window.electron.recorder().stopRecording();
        // window.electron.importer().importRecordedFiles();
      }
      this.recordImageSrc = this.isRecording
        ? "/pararIcone.png"
        : "/gravarIcone.png";
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
</style>
