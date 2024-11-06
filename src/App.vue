<template>
  <div>
    <header>
      <div class="barra-superior">
        <div class="esquerda" id="importButtons">
          <FileUpload />
          <button
            class="btn-acao"
            data-acao="texto"
            aria-label="Adicionar Texto"
            @click="openTextEditor"
          >
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
          <button class="btn-acao" data-acao="salvar" aria-label="Salvar">
            <img src="/salvarIcone.png" alt="Salvar" />
            <span class="legenda">Salvar</span>
          </button>
        </div>
        <div class="direita" id="recordButtons">
          <button
            class="btn-acao"
            id="startButton"
            data-acao="gravar"
            @click="toggleRecording"
            aria-label="Gravar"
          >
            <img id="imagePlay" :src="recordImageSrc" alt="Gravar" />
            <span id="textPlay" class="legenda">{{ isRecording ? "Parar" : "Gravar" }}</span>
          </button>
          <button
            :disabled="!isRecording"
            class="btn-acao"
            id="pauseButton"
            @click="pauseRecording"
            :style="{ opacity: isRecording ? 1 : 0.5 }"
            data-acao="pause"
            aria-label="Pause"
          >
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
          <MediaTabs @add-file="handleFileAdded" @delete-video="handleDeleteVideo"/>
        </div>
        <VideoPreview  @delete-video="handleDeleteVideo"/>
 
      </div>
      <TimeLine  @item-clicked="handleItemClicked" :selected-item="selectedItem" :timeline="timeline" :layers="layers" :update-layers="updateLayers" :select-video="selectedVideo" @item-selected="handleItemSelected"/>
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
      videos: [],
      selectedVideo: null,
      selectedItem: {item: null},
      isRecording: false,
      isPaused: false,
      recordImageSrc: "/gravarIcone.png",
      pauseImageSrc: "/pauseIcone.png",
      timeline: null,
      isTextEditorOpen: false,
      layers: [],
    };
  },
  created() {
    this.timeline = new TimeLine();
    this.layers = [
      { items: this.timeline.listFilesInLayer(0) },
      { items: this.timeline.listFilesInLayer(1) },
      { items: this.timeline.listFilesInLayer(2) },
    ];
  },
  methods: {
    toggleRecording() {
      this.isRecording = !this.isRecording;
      this.recordImageSrc = this.isRecording ? "/pararIcone.png" : "/gravarIcone.png";
    },
    pauseRecording() {
      this.isPaused = !this.isPaused;
      this.pauseImageSrc = this.isPaused ? "/gravarIcone.png" : "/pauseIcone.png";
    },
    handleFileAdded(fileData) {
      this.timeline.addFileToLayer(fileData);
      this.updateLayers();
    },
    handleDeleteVideo() {
      // const index = this.videos.indexOf(video);
      this.timeline.removeFileFromLayer({ file: this.selectedItem.item, layerIndex: this.selectedItem.layerIndex }); // Ajuste conforme necessário
      this.updateLayers();
      // if (index !== -1) {
        // this.videos.splice(index, 1); // Remove o vídeo da lista
        // Lógica para remover o vídeo da timeline se necessário
      // }
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
    updateLayers() {
      this.layers = [
        { items: this.timeline.listFilesInLayer(0) },
        { items: this.timeline.listFilesInLayer(1) },
        { items: this.timeline.listFilesInLayer(2) },
      ];
    }
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
</style>
 