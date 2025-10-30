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
      <!-- <button @click="undo" :disabled="!canUndo">↩ Undo</button> -->
      <!-- <button @click="redo" :disabled="!canRedo">↪ Redo</button> -->
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
import { useTimelineStore } from '../stores/timeline';

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
    },
    projects: {
      type: Array,
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
      showModal: false,
      selectedZoom: 1,
      initialGrabOffset: 0,
    };
  },
  computed: {
    timelineStore() {
      return useTimelineStore();
    },
    isItemSelected() {
      return this.selectedItem !== null;
    },
    totalVideoDuration() {
      if (!this.layers || !this.layers[0] || !this.layers[0].items) {
        return 0;
      }
      return this.layers[0].items.reduce(
        (total, video) => total + (video?.duration || 0),
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
  },
  beforeDestroy() {
    document.removeEventListener("mousemove", this.grabMove);
    document.removeEventListener("mouseup", this.grabDone);
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
    // downloadProject() {
    //   try {
    //     this.timeline.downloadProject();
    //     console.log("Projeto baixado como arquivo JSON.");
    //   } catch (error) {
    //     console.error("Erro ao baixar o projeto:", error);
    //   }
    // },
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
        // Usar requestAnimationFrame para movimento mais suave
        requestAnimationFrame(() => {
          const timelineElement = this.$el;
          const timelineRect = this.$el
            .querySelector(".time")
            .getBoundingClientRect();
          
          // Incluir o scroll horizontal da timeline no cálculo
          const scrollLeft = timelineElement.scrollLeft;
          const viewportWidth = timelineElement.getBoundingClientRect().width;
          
          // Calcular posição do mouse relativa à timeline, considerando o offset inicial
          const mouseRelativeX = event.clientX - timelineRect.left;
          
          // Auto-scroll suave quando próximo das bordas
          const scrollBuffer = 80; // pixels da borda para começar o scroll
          const scrollSpeed = 15; // velocidade do scroll
          
          if (mouseRelativeX < scrollBuffer && scrollLeft > 0) {
            // Mouse próximo da borda esquerda - scroll para esquerda
            const newScrollLeft = Math.max(0, scrollLeft - scrollSpeed);
            timelineElement.scrollLeft = newScrollLeft;
          } else if (mouseRelativeX > viewportWidth - scrollBuffer) {
            // Mouse próximo da borda direita - scroll para direita  
            const maxScroll = Math.max(0, this.dynamicCanvasWidth - viewportWidth);
            const newScrollLeft = Math.min(maxScroll, scrollLeft + scrollSpeed);
            timelineElement.scrollLeft = newScrollLeft;
          }
          
          // Recalcular posição após possível scroll
          const currentScrollLeft = timelineElement.scrollLeft;
          
          // Calcular nova posição considerando o offset inicial do grab
          let newPosition = (event.clientX - timelineRect.left - this.initialGrabOffset) + currentScrollLeft;
          
          // Limitar dentro dos bounds da timeline
          const maxWidth = this.dynamicCanvasWidth;
          newPosition = Math.max(0, Math.min(newPosition, maxWidth));
          
          // Aplicar movimento suave para evitar saltos
          const currentPos = this.cursorPosition;
          const targetMovement = newPosition - currentPos;
          const maxMovementPerFrame = 100; // limite de movimento por frame
          
          let finalPosition;
          if (Math.abs(targetMovement) > maxMovementPerFrame) {
            // Se o movimento é muito grande, aplicar progressivamente
            finalPosition = currentPos + Math.sign(targetMovement) * maxMovementPerFrame;
          } else {
            finalPosition = newPosition;
          }
          
          // Atualizar posição do cursor
          this.cursorPosition = finalPosition;
          
          // Calcular e atualizar o tempo
          const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
          const currentTimeInSeconds = this.cursorPosition * secondsPerPixel;
          this.currentTime = this.formatTime(currentTimeInSeconds);
          this.$emit('cursor-moved', currentTimeInSeconds);
        });
      }
    },

    grabDone() {
      this.isGrabbing = false;
      // Remover classe de dragging para feedback visual
      this.$el.classList.remove('timeline-dragging');
      document.body.style.cursor = '';
    },
    grabTime(event) {
      this.isGrabbing = true;
      // Adicionar classe de dragging para feedback visual
      this.$el.classList.add('timeline-dragging');
      document.body.style.cursor = 'grabbing';
      
      // Armazenar posição inicial para evitar saltos
      const timelineRect = this.$el.querySelector(".time").getBoundingClientRect();
      const scrollLeft = this.$el.scrollLeft;
      this.initialGrabOffset = event.clientX - timelineRect.left - (this.cursorPosition - scrollLeft);
      
      // Prevenir seleção de texto durante o drag
      event.preventDefault();
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
    onTimelineClick(event) {
      // Calcula o clique relativo à timeline incluindo scroll
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollLeft = event.currentTarget.scrollLeft;
      const clickX = event.clientX - rect.left + scrollLeft;
      
      // Converte posição em pixels para segundos
      const secondsPerPixel = (this.config.minimumScaleTime * 10) / 100;
      const timeInSeconds = clickX * secondsPerPixel;
      
      // Limitar o tempo dentro dos limites da timeline
      const maxTime = this.totalVideoDuration;
      const clampedTime = Math.max(0, Math.min(timeInSeconds, maxTime));
      
      // Atualiza o cursor para a posição do clique
      this.updateCurrentTime(clampedTime);
      
      // Emite evento pro pai com o tempo clicado
      this.$emit('cursor-moved', clampedTime);
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
      const newPosition = currentTimeInSeconds / secondsPerPixel;
      
      // Garantir que a posição não exceda os limites da timeline
      const maxPosition = this.dynamicCanvasWidth;
      const targetPosition = Math.max(0, Math.min(newPosition, maxPosition));
      
      // Se não estiver sendo arrastado, usar transição suave
      if (!this.isGrabbing) {
        this.animateCursorTo(targetPosition);
      } else {
        this.cursorPosition = targetPosition;
      }
      
      this.currentTime = this.formatTime(currentTimeInSeconds);
      
      // Auto-scroll para manter o cursor visível se necessário
      if (!this.isGrabbing) {
        this.ensureCursorVisible();
      }
    },
    
    animateCursorTo(targetPosition) {
      const startPosition = this.cursorPosition;
      const distance = targetPosition - startPosition;
      const duration = 200; // 200ms de duração
      let startTime = null;
      
      const animateCursor = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function para movimento suave
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        this.cursorPosition = startPosition + (distance * easeOutCubic);
        
        if (progress < 1) {
          requestAnimationFrame(animateCursor);
        }
      };
      
      requestAnimationFrame(animateCursor);
    },
    
    ensureCursorVisible() {
      this.$nextTick(() => {
        const timelineElement = this.$el;
        if (!timelineElement) return;
        
        const timelineRect = timelineElement.getBoundingClientRect();
        const scrollLeft = timelineElement.scrollLeft;
        const viewportWidth = timelineRect.width;
        
        // Posição absoluta do cursor na timeline
        const cursorAbsolutePosition = this.cursorPosition;
        
        // Posição relativa do cursor no viewport atual
        const cursorRelativePosition = cursorAbsolutePosition - scrollLeft;
        
        // Se o cursor está fora da área visível, fazer scroll suave para centralizá-lo
        if (cursorRelativePosition < 80) {
          // Cursor está muito próximo da borda esquerda
          const targetScroll = Math.max(0, cursorAbsolutePosition - viewportWidth / 3);
          this.smoothScrollTo(timelineElement, targetScroll);
        } else if (cursorRelativePosition > viewportWidth - 80) {
          // Cursor está muito próximo da borda direita
          const targetScroll = cursorAbsolutePosition - (2 * viewportWidth / 3);
          this.smoothScrollTo(timelineElement, targetScroll);
        }
      });
    },
    
    smoothScrollToCursor() {
      const timelineElement = this.$el;
      if (!timelineElement) return;
      
      const timelineRect = timelineElement.getBoundingClientRect();
      const scrollLeft = timelineElement.scrollLeft;
      const viewportWidth = timelineRect.width;
      const cursorRelativePosition = this.cursorPosition - scrollLeft;
      
      // Auto-scroll mais agressivo durante o drag
      if (cursorRelativePosition < 100) {
        const targetScroll = Math.max(0, this.cursorPosition - viewportWidth / 4);
        timelineElement.scrollLeft = targetScroll;
      } else if (cursorRelativePosition > viewportWidth - 100) {
        const targetScroll = this.cursorPosition - (3 * viewportWidth / 4);
        timelineElement.scrollLeft = targetScroll;
      }
    },
    
    smoothScrollTo(element, targetScroll) {
      const startScroll = element.scrollLeft;
      const distance = targetScroll - startScroll;
      const duration = 300; // 300ms de duração
      let startTime = null;
      
      const animateScroll = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function para movimento suave
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.scrollLeft = startScroll + (distance * easeInOutCubic);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
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
  scroll-behavior: smooth;
}

.timeline-dragging {
  user-select: none;
  cursor: grabbing;
}

.timeline-dragging * {
  cursor: grabbing !important;
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
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 50%, #9c2c2c 100%);
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
  transition-property: transform, box-shadow, background;
  transition-duration: 0.15s;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(206, 35, 35, 0.3);

  transform: translateX(-50%);
  /* Centralizar o cursor */
}

.timecursor:hover {
  transform: scale(1.08) translateX(-50%);
  cursor: grab;
  box-shadow: 0 4px 12px rgba(206, 35, 35, 0.4);
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 50%, #c53030 100%);
}

.timecursor:active,
.timeline-dragging .timecursor {
  cursor: grabbing;
  transform: scale(1.05) translateX(-50%);
  box-shadow: 0 6px 16px rgba(206, 35, 35, 0.5);
  background: linear-gradient(135deg, #c53030 0%, #9c2c2c 50%, #742a2a 100%);
}

.timecursor:after {
  transition-property: transform, margin-top, background-color, box-shadow;
  transition-duration: 0.15s;
  transition-timing-function: cubic-bezier(0.25, 0.8, 0.25, 1);
  content: "";
  display: block;
  height: 100vh;
  width: 0.14vw;
  /* Largura */
  background: linear-gradient(180deg, #ce2323 0%, rgba(206, 35, 35, 0.8) 70%, rgba(206, 35, 35, 0.4) 100%);
  margin-left: 2.26vw;
  /* Margem à esquerda */
  position: absolute;
  z-index: 2 !important;
  box-shadow: 0 0 4px rgba(206, 35, 35, 0.3);
}

.timeline-dragging .timecursor:after {
  background: linear-gradient(180deg, #9c2c2c 0%, rgba(156, 44, 44, 0.8) 70%, rgba(156, 44, 44, 0.4) 100%);
  box-shadow: 0 0 8px rgba(206, 35, 35, 0.5);
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
</style>
