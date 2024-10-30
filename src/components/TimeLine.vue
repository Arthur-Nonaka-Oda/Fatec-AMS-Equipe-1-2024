<template>
  <div class="timeline" @dragover="handleDragOver" @drop="handleDrop">
    <VideoEditingTimeline
      :config="{
        canvasWidth: dynamicCanvasWidth,
        minimumScale: 10,
        minimumScaleTime: config.minimumScaleTime,
      }"
      class="time"
    />
    <div
      class="timecursor"
      :style="{ left: cursorPosition + 'px' }"
      @mousedown="grabTime"
    >
      {{ currentTime }}
    </div>
    <div class="layers">
      <div
        v-for="(layer, layerIndex) in layers"
        :key="layerIndex"
        class="layer"
      >
        <div class="items">
          <TimeLineItem
            v-for="(item, index) in layer.items"
            :key="index"
            :layerIndex="layerIndex"
            :item="item"
            :title="item.name"
            :minimumScaleTime="config.minimumScaleTime"
            :index="index"
            :class="{ selected: selectedItem === item }"
            :select-video="selectVideo"
            @item-clicked="handleItemClicked"
            @select-item="selectItem(item)" 
          />
        </div>
      </div>
    </div>
    <div class="zoom-controls">
      <select id="zoom" v-model="selectedZoom" @change="updateZoom">
        <option value="0.1">10%</option>
        <option value="0.25">25%</option>
        <option value="0.5">50%</option>
        <option value="0.75">75%</option>
        <option value="1">100%</option>
        <option value="1.5">150%</option>
        <option value="2">200%</option>
        <option value="3">300%</option>
      </select>
    </div>
  </div>
</template>

<script>
import TimeLineItem from "./TimeLineItem.vue";
import VideoEditingTimeline from "video-editing-timeline-vue";

export default {
  props: {
    layers: {
      type: Array,
      default: () => [
        { type: "video", items: [{ duration: 120 }, { duration: 150 }] },
        { type: "audio", items: [{ duration: 90 }] },
        { type: "image", items: [{ duration: 30 }, { duration: 45 }] },
      ],
    },
    timeline: {
      type: Object,
      required: true,
    },
    updateLayers: {
      type: Function,
    },
    selectVideo:{
      type: Object,
    }
  },
  components: {
    TimeLineItem,
    VideoEditingTimeline,
  },
  data() {
  return {
    isGrabbing: false,
    currentTime: "00:00:00",
    cursorPosition: 0,
    config: {
      minimumScale: 10,
      minimumScaleTime: 6,
    },
    selectedZoom: 1,
    selectedItem: null, // Estado para o item selecionado
  };
},

  computed: {
    totalDuration() {
      return this.layers.reduce((total, layer) => {
        return (
          total +
          layer.items.reduce((layerTotal, item) => layerTotal + item.duration, 0)
        );
      }, 0);
    },
  totalVideoDuration() {
    return this.layers[0].items.reduce(
      (total, video) => total + (video.duration || 0),
      0
    );
  },
  totalAudioDuration() {
    return this.layers[1].items.reduce(
      (total, audio) => total + (audio.duration || 0),
      0
    );
  },
  totalImageDuration() {
    return this.layers[2].items.reduce(
      (total, image) => total + (image.duration || 0),
      0
    );
  },

  formattedTotalDuration() {
    const videoDuration = this.totalVideoDuration;
    const audioDuration = this.totalAudioDuration;
    const imageDuration = this.totalImageDuration;

    // Aqui você pode somar as durações
    const totalDuration = videoDuration + audioDuration + imageDuration;

    return this.formatTime(totalDuration);
  },
  dynamicCanvasWidth() {
    const secondsPerPixel = this.config.minimumScaleTime / 10;

    // Obter as durações individuais
    const videoDuration = this.totalVideoDuration;
    const audioDuration = this.totalAudioDuration;
    const imageDuration = this.totalImageDuration;

    // Encontrar a duração máxima
    const maxDuration = Math.max(videoDuration, audioDuration, imageDuration);

    const width = maxDuration / secondsPerPixel;
    return width;
  },
  }, 
  mounted(){
    console.log('Layers:', this.layers);
    document.addEventListener("mousemove", this.grabMove);
    document.addEventListener("mouseup", this.grabDone);
  },
  beforeUnmount() {
  document.removeEventListener("mousemove", this.grabMove);
  document.removeEventListener("mouseup", this.grabDone);
},

  methods: {
    getItemDuration(layerType, itemIndex) {
      const layer = this.layers.find((layer) => layer.type === layerType);
      return layer && layer.items[itemIndex] ? layer.items[itemIndex].duration : 0;
    },
    grabMove(event) {
      if (this.isGrabbing) {
        const timelineRect = this.$el
          .querySelector(".time")
          .getBoundingClientRect();
        let newPosition = event.clientX - timelineRect.left;
        newPosition = Math.max(0, Math.min(newPosition, timelineRect.width));
        this.cursorPosition = newPosition;
        this.updateCurrentTime();
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
          layerIndex = 2;
        }
        this.timeline.addFileToLayer({ file, layerIndex, type });
        this.updateLayers();
      }
    },
    selectItem(item) {
      this.selectedItem = item; // Define o item selecionado
    },
    handleItemClicked(item) {
    // this.selectItem(item); // Seleciona o item
    this.$emit('item-selected', item); // Emite o evento para o pai
  },

  handleDeleteVideo(video) {
      const index = this.videos.indexOf(video);
      if (index !== -1) {
        this.videos.splice(index, 1); // Remove o vídeo da lista
        this.timeline.removeFileFromLayer({ // Remove o vídeo da timeline
          file: video,
          layerIndex: 0, // Ajuste conforme necessário
        });
        this.updateLayers(); // Atualiza a visualização
      }
    },
    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    updateCurrentTime() {
      const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
      const currentTimeInSeconds = Math.round(
        this.cursorPosition * secondsPerPixel
      );
      this.timeline.setCurrentSecond(currentTimeInSeconds);
      this.currentTime = this.formatTime(currentTimeInSeconds);
    },
    updateZoom() {
      const zoomMapping = {
        0.1: 60,
        0.25: 24,
        0.5: 12,
        0.75: 8,
        1: 6,
        1.5: 4,
        2: 3,
        3: 2,
      };
      this.config.minimumScaleTime = zoomMapping[this.selectedZoom];
    },
  },
};
</script>

<style>
.selected {
  border: 2px solid rgb(255, 238, 0); /* ou qualquer estilo que destaque o item */
  background-color: rgb(101, 228, 226); /* destaque de fundo */
}

.total-duration {
  margin-top: 0.625rem; /* Espaçamento superior */
  font-size: 0.875rem; /* Tamanho da fonte */
  color: white; /* Cor do texto */
}

.timeline {
  position: relative;
  bottom: 0;
  border: 1px solid #0d185e;
  background-color: #0d185e;
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
  width: 4.51vw; /* Largura */
  height: 2.78vh; /* Altura */
  line-height: 2.78vh; /* Altura da linha */
  position: absolute;
  background-color: #ce2323;
  border-radius: 30px;
  top: 0px; /* Mantido */
  font-family: Inter;
  font-size: 0.75rem; /* Tamanho da fonte */
  color: white;
  z-index: 2 !important;
  text-align: center;
  margin-top: 0.5rem; /* Espaço superior */
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
  width: 0.14vw; /* Largura */
  background-color: #ce2323;
  margin-left: 2.26vw; /* Margem à esquerda */
  position: absolute;
  z-index: 2 !important;
}

.layers {
  top: 3.125rem;
  height: 50%;
  display: flex;
  flex-direction: column;
  width: fit-content;
  /* overflow-y: scroll;
    overflow-x: hidden;
    background-color: #0d185e00; */
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
  width: 4.86vw; /* Largura */
  text-align: center;
  font-family: Inter;
  font-size: 0.75rem; /* Tamanho da fonte */
  color: rgb(255, 255, 255);
  padding-top: 0.4375rem; /* Espaço superior */
  box-sizing: border-box;
  position: relative;
  padding-bottom: 0.625rem; /* Espaço inferior */
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
  bottom: 1.11vh; /* Distância do fundo */
  right: 0.69vw; /* Distância da direita */
  display: flex;
  gap: 0.625rem; /* Espaçamento entre os elementos */
  align-items: center;
}

.zoom-controls select {
  padding: 0.3125rem; /* Preenchimento */
  font-size: 0.875rem; /* Tamanho da fonte */
  border-radius: 0.25rem; /* Arredondamento das bordas */
  border: 1px solid #133a8d;
}
</style>