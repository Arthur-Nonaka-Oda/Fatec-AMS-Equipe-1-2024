<template>
  <div class="timeline" @dragover="handleDragOver" @drop="handleDrop" @click="onTimelineClick($event)">
    <VideoEditingTimeline :config="{
      canvasWidth: dynamicCanvasWidth,
      minimumScale: 10,
      minimumScaleTime: config.minimumScaleTime,
    }" class="time" />
    <div class="timecursor" :style="{ left: cursorPosition + 'px' }" @mousedown="grabTime">
      {{ currentTime }}
    </div>
    <!-- <div class="time" @mousemove="grabMove" @mouseup="grabDone">
            <div class="time-markers">
                <div v-for="second in filteredSeconds" :key="second" class="time-marker">
                    {{ formatTime(second) }}
                </div>
            </div>
        </div> -->
    <div class="layers">
      <div v-for="(layer, layerIndex) in layers" :key="layerIndex" class="layer">
        <div class="items">
          <TimeLineItem v-for="(item, index) in layer.items" :key="index" :layerIndex="layerIndex" :item="item"
            :title="item.name" :minimumScaleTime="config.minimumScaleTime" :index="index" :selectedItem="selectedItem"
            :select-video="selectVideo" @item-clicked="handleItemClicked"
            @context-menu-action="handleContextMenuAction" />
        </div>
      </div>
    </div>
    <div class="zoom-controls">
      <button @click="undo" :disabled="!timeline.history.canUndo">↩ Undo</button>
      <button @click="redo" :disabled="!timeline.history.canRedo">↪ Redo</button>
      <select id="zoom" v-model="selectedZoom" @change="updateZoom">
        <option value="0.1">10%</option>
        <option value="0.25">25%</option>
        <option value="0.5">50%</option>
        <option value="0.75">75%</option>
        <option value="1">100%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
        <option value="3">300%</option>
        <option value="5">500%</option>
      </select>

      <div class="project-controls">
        <button @click="saveProject">Salvar Projeto</button>
        <button @click="loadProject">Carregar Projeto</button>
        <button @click="downloadProject">Baixar Projeto</button>
        <input type="file" @change="loadFromFile" />
      </div>
      <div class="volume-controls">
        <VolumeSlider v-if="isItemSelected && selectedItem.item" :volume="selectedItem.item.volume ?? 1"
          @update-volume="updateItemVolume" />

      </div>

    </div>
  </div>
</template>

<script>
import TimeLineItem from "./TimeLineItem.vue";
import VideoEditingTimeline from "video-editing-timeline-vue";
import VolumeSlider from "./VolumeSlider.vue";

export default {
  props: {
    layers: {
      type: Array,
    },
    timeline: {
      type: Object,
      required: true,
    },
    updateLayers: {
      type: Function,
    },
    selectVideo: {
      type: Object,
    },
    selectedItem: {
      type: Object,
      required: true
    }
  },
  components: {
    TimeLineItem,
    VolumeSlider,
    VideoEditingTimeline,
  },
  data() {
    return {
      isGrabbing: false,
      currentTime: "00:00:00",
      cursorPosition: 0,
      config: {
        minimumScale: 10,
        minimumScaleTime: 1,
      },
      selectedZoom: 1,
    };
  },
  computed: {
    isItemSelected() {
      return this.selectedItem !== null;
    },
    totalVideoDuration() {
      return this.layers[0].items.reduce(
        (total, video) => total + (video.duration || 0),
        0
      );
    },
    formattedTotalDuration() {
      return this.formatTime(this.totalVideoDuration);
    },
    dynamicCanvasWidth() {
      const secondsPerPixel = this.config.minimumScaleTime / 10;

      const width = this.totalVideoDuration / secondsPerPixel;
      return width;
    },
  },
  mounted() {
    this.timeline.registerUpdateLayers(this.updateLayers);
    document.addEventListener("mousemove", this.grabMove);
    document.addEventListener("mouseup", this.grabDone);
    document.addEventListener('keydown', this.handleKeyEvents);
  },
  beforeDestroy() {
    document.removeEventListener("mousemove", this.grabMove);
    document.removeEventListener("mouseup", this.grabDone);
    document.removeEventListener('keydown', this.handleKeyEvents);
  },
  methods: {
    updateItemVolume(newVolume) {
      if (this.selectedItem && this.selectedItem.item) {
        this.$emit('update-item-volume', { ...this.selectedItem, volume: newVolume });
      }
    },
    handleContextMenuAction({ action, item, layerIndex }) {
      if (action === 'remover') {
        this.timeline.removeFileFromLayer({ file: item, layerIndex });
        this.updateLayers();
      } else if (action === 'recortar') {
        this.$emit('cut-item', { item, layerIndex });
      } else if (action === 'copiar') {
        this.$emit('copy-item', { item, layerIndex });
      } else if (action === 'colar') {
        this.$emit('paste-item', { item, layerIndex });
      }
    },
    onTimelineClick(event) {
      // Calcula o clique relativo à timeline
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      
      // Converte posição em pixels para segundos
      const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
      const timeInSeconds = clickX * secondsPerPixel;
      
      // Atualiza o cursor para a posição do clique
      this.updateCurrentTime(timeInSeconds);
      
      // Se quiser, emite evento pro pai com o tempo clicado
      this.$emit('cursor-moved', timeInSeconds);
    },
    saveProject() {
      try {
        this.timeline.saveProject();
        console.log("Projeto salvo no localStorage.");
      } catch (error) {
        console.error("Erro ao salvar o projeto:", error);
      }
    },
    loadProject() {
      try {
        this.timeline.loadProject();
        this.updateLayers(); // Atualiza as camadas no Vue
        console.log("Projeto carregado do localStorage.");
      } catch (error) {
        console.error("Erro ao carregar o projeto:", error);
      }
    },
    downloadProject() {
      try {
        this.timeline.downloadProject();
        console.log("Projeto baixado como arquivo JSON.");
      } catch (error) {
        console.error("Erro ao baixar o projeto:", error);
      }
    },
    loadFromFile(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            localStorage.setItem("savedProject", e.target.result);
            this.timeline.loadProject();
            this.updateLayers(); // Atualiza as camadas no Vue
            console.log("Projeto carregado do arquivo.");
          } catch (error) {
            console.error("Erro ao carregar o projeto do arquivo:", error);
          }
        };
        reader.readAsText(file);
      }
    },
    grabMove(event) {
      if (this.isGrabbing) {
        const timelineRect = this.$el
          .querySelector(".time")
          .getBoundingClientRect();
        let newPosition = event.clientX - timelineRect.left;
        newPosition = Math.max(0, Math.min(newPosition, timelineRect.width));
        this.cursorPosition = newPosition;
        const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
        const currentTimeInSeconds = this.cursorPosition * secondsPerPixel;
        this.currentTime = this.formatTime(currentTimeInSeconds);
        this.$emit('cursor-moved', currentTimeInSeconds);
      }
    },

    grabDone() {
      this.isGrabbing = false;
    },
    grabTime() {
      this.isGrabbing = true;
    },

    handleDragOver(event) {
      event.preventDefault();
    },
    handleDrop(event) {

      event.preventDefault();

      const internalData = event.dataTransfer.getData('application/x-timeline-item');
      if (internalData) {
        const { layerIndex: sourceLayerIndex, itemIndex: sourceItemIndex } = JSON.parse(internalData);

        const timelineRect = this.$el.querySelector('.layers').getBoundingClientRect();
        const x = event.clientX - timelineRect.left;
        const secondsPerPixel = this.config.minimumScaleTime / 10;
        const dropTime = x * secondsPerPixel;

        const targetLayerIndex = sourceLayerIndex;
        const items = this.timeline.listFilesInLayer(targetLayerIndex);
        let cumulativeTime = 0;
        let targetIndex = items.length;

        for (let i = 0; i < items.length; i++) {
          cumulativeTime += items[i].duration;
          if (cumulativeTime > dropTime) {
            targetIndex = i;
            break;
          }
        }

        this.timeline.moveItem(
          sourceLayerIndex,
          sourceItemIndex,
          targetLayerIndex,
          targetIndex
        );

        this.updateLayers();
        return;
      }



      let fileData = "";
      let type = "";

      if (event.dataTransfer.types.includes("video")) {
        fileData = event.dataTransfer.getData("video");
        type = "video";
      } else if (event.dataTransfer.types.includes("audio")) {
        fileData = event.dataTransfer.getData("audio");
        type = "audio";
      } else if (event.dataTransfer.types.includes("image")) {
        fileData = event.dataTransfer.getData("image");
        type = "image";
      }

      if (fileData) {
        const file = JSON.parse(fileData);
        let layerIndex;
        if (type === "video") {
          layerIndex = 0;
        } else if (type === "audio") {
          layerIndex = 1;
        } else if (type === "image") {
          layerIndex = 0;
        }
        this.timeline.addFileToLayer({ file, layerIndex, type });
        this.updateLayers();
      }
    },
    handleItemClicked(item) {
  this.$emit('item-clicked', item);
  if(item.startTime) {  // Supondo que seu item tenha tempo inicial
    this.updateCurrentTime(item.startTime);
  }
},
    handleDeleteVideo(video) {
      this.timeline.removeFileFromLayer({
        file: video,
        layerIndex: 0
      });
      this.updateLayers();
    },
    handleUndo() {
      if (this.timeline && this.timeline.history) {
        this.timeline.undo();
        this.updateLayers();
      }
    },

    handleRedo() {
      if (this.timeline && this.timeline.history) {
        this.timeline.redo();
        this.updateLayers();
      }
    },
    formatTime(seconds) {
      const roundedSeconds = Math.floor(seconds);
      const hours = Math.floor(roundedSeconds / 3600);
      const minutes = Math.floor((roundedSeconds % 3600) / 60);
      const remainingSeconds = roundedSeconds % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    updateCurrentTime(currentTimeInSeconds) {
      const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
      this.cursorPosition = currentTimeInSeconds / secondsPerPixel;
      this.currentTime = this.formatTime(currentTimeInSeconds);
    },

    updateZoom() {
      const zoomMapping = {
        0.1: 10,  // 10% zoom
        0.25: 5,  // 25% zoom
        0.5: 2,   // 50% zoom
        0.75: 1.5, // 75% zoom
        1: 1,     // 100% zoom (1:1)
        1.5: 0.75, // 150% zoom
        2: 0.5,   // 200% zoom
        3: 0.33,  // 300% zoom
        5: 0.2,   // 500% zoom
      };
      this.config.minimumScaleTime = zoomMapping[this.selectedZoom];
    },
    undo() {
      this.timeline.history.undo();
    },
    redo() {
      this.timeline.history.redo();
    },
    handleKeyEvents(event) {
      // Ctrl+Z para desfazer
      if (event.ctrlKey && !event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
        event.preventDefault();
        this.handleUndo();
      }
      // Ctrl+Y para refazer
      else if (event.ctrlKey && (event.key === 'y' || event.key === 'Y')) {
        event.preventDefault();
        this.handleRedo();
      }
    },
  },
};
</script>

<style scoped>
.project-controls {
  position: fixed;
  bottom: 50px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.volume-controls {
  position: fixed;
  bottom: 0px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* background-color: #323C7D; */
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

.selected {
  border: 2px solid rgb(255, 238, 0);
  /* ou qualquer estilo que destaque o item */
  background-color: rgb(101, 228, 226);
  /* destaque de fundo */
}


.total-duration {
  margin-top: 0.625rem;
  /* Espaçamento superior */
  font-size: 0.875rem;
  /* Tamanho da fonte */
  color: white;
  /* Cor do texto */
}

.timeline {
  position: relative;
  bottom: 0;
  border: 1px solid #0F153C;
  background-color: #0F153C;
  height: 30%;
  overflow-y: hidden;
  overflow-x: scroll;
  width: 100%;
}

.timeline::-webkit-scrollbar {
  height: 2.22vh;
}

.timeline::-webkit-scrollbar-track {
  background: #5a6ac2 !important;
}

.timeline::-webkit-scrollbar-thumb {
  height: 1.89vh;
  background-color: #133a8d;
  border-radius: 0px;
  border: 2px solid #5a6ac2;
}

.time {
  user-select: none;
  width: fit-content;
  background-color: #cccccc00;
  display: flex;
  align-items: start;
  position: relative;
}

.timecursor {
  width: 4.51vw;
  /* Largura */
  height: 2.78vh;
  /* Altura */
  line-height: 2.78vh;
  /* Altura da linha */
  position: absolute;
  background-color: #ce2323;
  border-radius: 30px;
  top: 0px;
  /* Mantido */
  font-family: Inter;
  font-size: 0.75rem;
  /* Tamanho da fonte */
  color: white;
  z-index: 2 !important;
  text-align: center;
  margin-top: 0.5rem;
  /* Espaço superior */
  transition-property: transform;
  transition-duration: 0.2s;
  transition-timing-function: cubic-bezier(0.05, 0.03, 0.35, 1);
  user-select: none;

  transform: translateX(-50%);
  /* Centralizar o cursor */
}

.timecursor:hover {
  transform: scale(1.12) translateX(-50%);
  cursor: pointer;
}

.timecursor:after {
  transition-property: transform, margin-top;
  transition-duration: 0.25s;
  transition-timing-function: cubic-bezier(0.05, 0.03, 0.35, 1);
  content: "";
  display: block;
  height: 100vh;
  width: 0.14vw;
  /* Largura */
  background-color: #ce2323;
  margin-left: 2.26vw;
  /* Margem à esquerda */
  position: absolute;
  z-index: 2 !important;
}

.layers {
  top: 3.125rem;
  height: 30%;
  display: flex;
  flex-direction: column;
  width: fit-content;
  /* overflow-y: scroll;
    overflow-x: hidden;
    background-color: #0F153C00; */
}

.layer {
  margin-bottom: 3px;
}

.videos {
  display: flex;
  background-color: #b81313;
  height: 100%;
}

.items {
  display: flex;
  height: 100%;
}

.audios {
  display: flex;
  height: 100%;
  background-color: #c7771c;
}

.images {
  display: flex;
  height: 100%;
  background-color: #1ddb3c;
}

.time-markers {
  display: flex;
  flex-grow: 1;
  width: fit-content;
  overflow-x: hidden;
  /* Remover overflow horizontal */
  /* height: 40px; */
}

.time-marker {
  user-select: none;
  width: 4.86vw;
  /* Largura */
  text-align: center;
  font-family: Inter;
  font-size: 0.75rem;
  /* Tamanho da fonte */
  color: rgb(255, 255, 255);
  padding-top: 0.4375rem;
  /* Espaço superior */
  box-sizing: border-box;
  position: relative;
  padding-bottom: 0.625rem;
  /* Espaço inferior */
  /* height: auto; */
}

.time-marker::after {
  content: "";
  position: absolute;
  bottom: 0px;
  /* Ajustar para alinhar com a borda inferior */
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 10px;
  /* Altura da linha vertical */
  background-color: #ffffff;
  /* Cor da linha vertical */
}

.zoom-controls {
  position: fixed;
  bottom: 10px;
  /* Define a posição no canto inferior */
  right: 20px;
  z-index: 1000;
  /* Mantém o elemento acima de outros */
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #323C7D;
  /* Fundo para melhor visibilidade */
}

.zoom-controls select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 8px 12px;
  font-size: 14px;
  color: #fff;
  /* Cor da fonte branca */
  background-color: #323C7D;
  border: 1px solid #ddd;
  border-radius: 0;
  /* Bordas quadradas */
  transition: background-color 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}

.zoom-controls select:hover {
  background-color: #ffffff;
  border-color: #bbb;
  color: #000
}
</style>
