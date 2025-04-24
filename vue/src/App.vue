<template>
  <div>
    <header>
      <div v-if="isLoading" class="loading-screen">
        <p>Carregando...</p>
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
        @cursor-moved="handleCursorMoved" />
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
    };
  },
  created() {
    this.timeline = new TimeLine();
    this.layers = this.timeline.getLayersForVue();

    window.addEventListener("keydown", this.handleKeyDown);
  },
  beforeDestroy() {
    // Remove o listener quando o componente é destruído
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    updateLayers(newLayers) {
      this.layers = newLayers || this.timeline.getLayersForVue();

      const hasItems = this.layers.some((layer) => layer.items.length > 0);
      if (hasItems) {
        // this.createVideoFromBlobs();
      } else {
        this.videoUrl = `data:video/mp4;base64,${""}`;
      }
    },
    async renderizeVideo() {
      this.isLoading = true;
      const videos = this.layers[0].items.map(video => ({
        filePath: video.filePath,
        startTime: video.startTime,
        endTime: video.endTime,
      }));
      const audios = this.layers[1].items.map(audio => ({
        filePath: audio.filePath,
        startTime: audio.startTime,
        endTime: audio.endTime,
      }));
      try {
        await window.electron.ipcRenderer.invoke("renderize", {
          videos,
          audios,
        });
      } finally {
        this.isLoading = false;
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
      // const index = this.videos.indexOf(video);
      this.timeline.removeFileFromLayer({
        file: this.selectedItem.item,
        layerIndex: this.selectedItem.layerIndex,
      }); // Ajuste conforme necessário
      console.log("delete");
      console.log(this.timeline.listFilesInLayer(0));
      console.log(this.timeline.listFilesInLayer(1));
      console.log(this.timeline.listFilesInLayer(2));
      this.updateLayers();
      // if (index !== -1) {
      // this.videos.splice(index, 1); // Remove o vídeo da lista
      // Lógica para remover o vídeo da timeline se necessário
      // }
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
      }
    
      this.updateLayers();
    },
    async createVideoFromBlobs() {
      this.isLoading = true;
      const videosInfo = this.layers[0].items.map(video => ({
        filePath: video.filePath,
        startTime: video.startTime,
        endTime: video.endTime
      }));
      console.log("front/combine/ " + videosInfo);

      try {
        const result = await window.electron.ipcRenderer.invoke(
          "combine-videos",
          { videosInfo }
        );
        this.videoUrl = `data:video/mp4;base64,${result}`;
      } finally {
        this.isLoading = false;
      }
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

    async cutVideo() {
      if (this.startTime === null) {
        alert("Por favor, mova o cursor para o ponto de corte.");
        return;
      }

      const filePath = this.videoFilePath;

      try {
        const base64Video = await window.electron.ipcRenderer.invoke(
          "cut-video",
          {
            filePath,
            startTime: this.startTime,
            duration: this.duration,
          }
        );

        this.videoUrl = `data:video/mp4;base64,${base64Video}`;
        this.closeCutEditor();
      } catch (error) {
        console.error("Erro ao cortar o vídeo:", error);
      }
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

.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 2em;
  z-index: 100;
}
</style>
