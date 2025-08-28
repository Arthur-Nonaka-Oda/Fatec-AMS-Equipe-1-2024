<template>
  <div class="timeline-item"
       @click="handleClick"
       :style="{ width: itemWidth + 'px' }"
       :class="{ selected: isSelected }"
       draggable="true"
       @dragstart="handleDragStart"
       @dragend="handleDragEnd"
       @contextmenu.prevent="handleRightClick">

    <div v-if="isSelected && item.type !== 'image'" class="volume-line-horizontal" :style="{ top: volumeLinePosition + 'px' }"></div>

    <div v-if="isSelected && item.type !== 'image'"
         class="volume-control"
         @mousedown.stop.prevent="startResizing"
         :style="{ top: volumeLinePosition + 'px' }">
      <font-awesome-icon icon="angle-up" class="volume-icon" />
      <div class="volume-percentage">{{ Math.round(volume * 100) }}%</div>
    </div>

    <template v-if="item.type === 'audio'">
      <div class="audio-icon">
        <font-awesome-icon :icon="['fas', 'music']" /> Áudio
      </div>
    </template>
    <template v-else-if="item.type === 'video'">
      <img class="item-content" :src="item.thumbnailUrl || item.url" alt="Conteúdo" />
    </template>
    <template v-else>
      <img class="item-content" :src="item.url" alt="Conteúdo" />
    </template>

    <ContextTools v-if="showContextMenu"
                  :x="contextMenuPosition.x"
                  :y="contextMenuPosition.y"
                  @action="onMenuAction"
                  @mousedown.stop />
  </div>
</template>

<script>
import ContextTools from './ContextTools.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default {
  name: 'TimelineItem',
  components: {
    ContextTools,
    FontAwesomeIcon
  },
  
  props: {
    volume: {
            type: Number,
            required: true
        },
    item: {
      type: Object,
      required: true
    },
    index: Number,
    selectedItem: Object,
    minimumScaleTime: Number,
    layerIndex: Number,
  },
  data() {
    return {
      isDragging: false,
      isSelected: false,
      showContextMenu: false,
      contextMenuPosition: { x: 0, y: 0 },
      isResizing: false,
      startY: 0,
      startVolume: 0.5,
      itemHeight: 60,
    };
  },
  computed: {
    itemWidth() {
      const secondsPerPixel = this.minimumScaleTime / 10;
      return this.item.duration / secondsPerPixel;
    },
    volume: {
      get() {
        return this.item.volume !== undefined ? this.item.volume : 1;
      },
      set(newVal) {
        this.$emit('volume-change', { item: this.item, volume: newVal, layerIndex: this.layerIndex });
      }
    },
    volumeLinePosition() {
      return this.itemHeight - this.volume * this.itemHeight;
    }
  },
  watch: {
    selectedItem(newVal) {
      this.isSelected = newVal && newVal.item === this.item;
    }
  },
  mounted() {
    this.isSelected = this.selectedItem && this.selectedItem.item === this.item;
  },
  methods: {
    handleRightClick(event) {
      this.showContextMenu = true;
      this.contextMenuPosition = { x: event.clientX, y: event.clientY };
      document.addEventListener('mousedown', this.closeContextMenu);
    },
    closeContextMenu(event) {
      if (!event || !event.target.closest('.tools')) {
        this.showContextMenu = false;
        document.removeEventListener('mousedown', this.closeContextMenu);
      }
    },
    onMenuAction(action) {
      this.$emit('context-menu-action', { action, item: this.item, layerIndex: this.layerIndex });
      this.closeContextMenu();
    },
    handleDragStart(event) {
      this.isDragging = true;
      event.stopPropagation();
      event.dataTransfer.setData('application/x-timeline-item', JSON.stringify({
        layerIndex: this.layerIndex,
        itemIndex: this.index
      }));
      event.dataTransfer.effectAllowed = 'move';
    },
    handleDragEnd() {
      this.isDragging = false;
    },
    handleClick() {
      this.$emit('item-clicked', { item: this.item, layerIndex: this.layerIndex });
    },
    startResizing(event) {
      this.isResizing = true;
      this.startY = event.clientY;
      this.startVolume = this.volume;
      document.addEventListener('mousemove', this.resizeVolume);
      document.addEventListener('mouseup', this.stopResizing);
    },
    resizeVolume(event) {
      if (!this.isResizing) return;
      const deltaY = this.startY - event.clientY;
      let newVolume = this.startVolume + deltaY / this.itemHeight;
      this.volume = Math.min(1, Math.max(0, newVolume));
    },
    stopResizing() {
      this.isResizing = false;
      document.removeEventListener('mousemove', this.resizeVolume);
      document.removeEventListener('mouseup', this.stopResizing);
    }
  }
};
</script>

<style scoped>
/* Estilos existentes */
.timeline-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  height: 60px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.timeline-item.selected {
  background-color: #e0f7fa; /* Um azul mais claro para destaque */
  border: 2px solid #00796b; /* Borda de destaque verde-azulado */
  transform: scale(1.05);
}

.timeline-item:hover {
  background-color: #f0f0f0;
  transform: scale(1.02);
}

img.item-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 8px;
}

.audio-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #80cbc4; /* Fundo mais suave */
  color: #004d40; /* Cor do texto escura */
  font-weight: bold;
  gap: 8px; /* Espaço entre o ícone e o texto */
}

/* Linha horizontal que percorre toda a largura do item */
.volume-line-horizontal {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #ff5722; /* Linha laranja vibrante */
  z-index: 1;
}

/* Controle de volume (ícone + %) */
.volume-control {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
  user-select: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  color: #fff;
  z-index: 2;
  transition: top 0.1s ease;
  font-weight: 600;
  text-shadow: 0 0 3px rgba(0,0,0,0.7);
}

.volume-icon {
  font-size: 16px; /* Tamanho ajustado */
  background-color: #ff5722; /* Fundo laranja para o ícone */
  border-radius: 50%;
  padding: 4px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7));
}

/* Porcentagem ao lado do ícone */
.volume-percentage {
  margin-left: 6px;
  font-size: 10px; /* Tamanho ajustado */
  user-select: none;
  background-color: rgba(0,0,0,0.5); /* Fundo semi-transparente para o texto */
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
  text-shadow: none;
}
</style>