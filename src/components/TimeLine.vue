<template>
    <div class="timeline" @dragover="handleDragOver" @drop="handleDrop">
        <VideoEditingTimeline :config="{ canvasWidth: dynamicCanvasWidth, minimumScale: 10, minimumScaleTime: config.minimumScaleTime }" />
        <div class="timecursor" :style="{ left: cursorPosition + 'px' }" @mousedown="grabTime">{{ currentTime }}</div>
        <!-- <div class="time" @mousemove="grabMove" @mouseup="grabDone">
            <div class="time-markers">
                <div v-for="second in filteredSeconds" :key="second" class="time-marker">
                    {{ formatTime(second) }}
                </div>
            </div>rgrgrg
        </div> -->
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
            :item="item"
            :title="item.name"
            :minimumScaleTime="config.minimumScaleTime"
            :index="index"
            @item-clicked="handleItemClicked"
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
    // videos: {
    //     type: Array,
    //     default: () => []
    // },
    // images: {
    //     type: Array,
    //     default: () => []
    // },
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
        canvasWidth: 1920,
        minimumScale: 10,
        minimumScaleTime: 6,
      },
      selectedZoom: 1,
    };
  },
  computed: {
    totalVideoDuration() {
      return this.videos.reduce(
        (total, video) => total + (video.duration || 0),
        0
      );
    },
    formattedTotalDuration() {
      return this.formatTime(this.totalVideoDuration);
    },
  },
  mounted() {
    document.addEventListener("mousemove", this.grabMove);
    document.addEventListener("mouseup", this.grabDone);
  },
  beforeDestroy() {
    document.removeEventListener("mousemove", this.grabMove);
    document.removeEventListener("mouseup", this.grabDone);
  },
  methods: {
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
        console.log("video")
        console.log("video")
      } if (event.dataTransfer.types.includes("audio")) {
        fileData = event.dataTransfer.getData("audio");
        type = "audio";
      } if (event.dataTransfer.types.includes("image")) {
        fileData = event.dataTransfer.getData("image");
        type = "image";
      }

      if (fileData) {
        const file = JSON.parse(fileData);
        this.timeline.addFileToLayer({ file, layerIndex: 0, type });
        this.updateLayers();
      }
    },
    handleItemClicked(item) {
      this.timeline.removeVideo(item);
      this.updateLayers();
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
      // const timelineWidth = this.$el.querySelector('.time').clientWidth;
      // this.config.canvasWidth / 100;
      // this.config.minimumScaleTime * 10;
      const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
      const currentTimeInSeconds = Math.round(
        this.cursorPosition * secondsPerPixel
      );
      this.timeline.setCurrentSecond(currentTimeInSeconds);
      this.currentTime = this.formatTime(currentTimeInSeconds);
    },
    updateZoom() {
      // Aqui, ajusta o minimumScaleTime baseado no zoom selecionado
      const zoomMapping = {
        0.1: 60, // 10%
        0.25: 24, // 25%
        0.5: 12, // 50%
        0.75: 8, // 75%
        1: 6, // 100% (referência padrão)
        1.5: 4, // 150%
        2: 3, //200%
        3: 2,
      };
      this.config.minimumScaleTime = zoomMapping[this.selectedZoom];
    },
  },
};
</script>

<style scoped>
.total-duration {
  margin-top: 10px;
  font-size: 14px;
  color: white;
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
  height: 20px;
}

.timeline::-webkit-scrollbar-track {
  background: #5a6ac2 !important;
}

.timeline::-webkit-scrollbar-thumb {
  height: 17px;
  background-color: #133a8d;
  border-radius: 0px;
  border: 2px solid #5a6ac2;
}

.time {
  user-select: none;
  width: fit-content;
  /* height: 15%; */
  background-color: #cccccc00;
  display: flex;
  align-items: start;
  position: relative;
}

.timecursor {
  width: 65px;
  height: 25px;
  line-height: 25px;
  position: absolute;
  background-color: #ce2323;
  border-radius: 30px;
  top: 0px;
  font-family: Inter;
  font-size: 12px;
  color: white;
  z-index: 2 !important;
  text-align: center;
  margin-top: 8px;
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
  width: 2px;
  background-color: #ce2323;
  margin-left: 32.5px;
  position: absolute;
  z-index: 2 !important;
}

.layers {
  top: 50px;
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
  width: 70px;
  text-align: center;
  font-family: Inter;
  font-size: 12px;
  color: rgb(255, 255, 255);
  padding-top: 7px;
  box-sizing: border-box;
  position: relative;
  padding-bottom: 10px;
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
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.zoom-controls select {
  padding: 5px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #133a8d;
}
</style>
