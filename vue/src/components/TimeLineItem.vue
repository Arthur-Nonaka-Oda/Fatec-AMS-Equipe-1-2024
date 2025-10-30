<template>
  <div class="timeline-item" @click="handleClick" :style="{ width: itemWidth + 'px' }"
    :class="{ selected: selectedItem.item === item }" draggable="true" @dragstart="handleDragStart"
    @dragend="handleDragEnd" @contextmenu.prevent="handleRightClick">
    <template v-if="isAudioItem">
      <AudioWaveform 
        :key="`audio_${layerIndex}_${index}_${item.name || 'unknown'}`"
        :audioItem="item" 
        :width="itemWidth" 
        :height="45" 
        class="item-content"
      />
    </template>
    <template v-else>
      <img class="item-content" :src="item.url" alt="Conteúdo" />
    </template>
    
    <div v-if="selectedItem.item === item" 
         class="volume-bar-container" 
         @dblclick="handleBarClick">
      <div class="volume-track">
        <div class="volume-bar-fill" 
             :style="{ width: `${currentVolume * 100}%` }">
        </div>
      </div>
      <div class="volume-knob"
           :style="{ left: `${currentVolume * 100}%` }"
           @mousedown.stop="startVolumeAdjust"
           :class="{ 'dragging': isDraggingVolume }">
        <div class="volume-value">{{ Math.round(currentVolume * 100) }}%</div>
      </div>
    </div>
    <ContextTools v-if="showContextMenu" :x="contextMenuPosition.x" :y="contextMenuPosition.y" @action="onMenuAction"
      @mousedown.stop />
  </div>
</template>

<script>
import ContextTools from './ContextTools.vue';
import AudioWaveform from './AudioWaveform.vue';
import Audio from '../models/Audio.js';

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    item: {
      type: Object,
      required: true,
    },
    selectedItem: {
      type: Object,
      required: true
    },
    minimumScaleTime: {
      type: Number,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    selectVideo: {
      type: Object,
    }
  },
  components: {
    ContextTools,
    AudioWaveform
  },
  created() {
    console.log(this.selectedItem);
    console.log(this.item);
  },
  data() {
    return {
      isDragging: false,
      isDraggingVolume: false,
      initialY: 0,
      initialVolume: 0,
      isSelected: false,
      showContextMenu: false,
      contextMenuPosition: { x: 0, y: 0 },
      volumeBarHeight: 0,
      volumeBarTop: 0
    };
  },
  methods: {
    handleRightClick(event) {
      event.preventDefault();
      // this.showContextMenu = true;
      // this.contextMenuPosition = { x: event.clientX, y: event.clientY };
      // setTimeout(() => {
      //   document.addEventListener('mousedown', this.closeContextMenu);
      // }, 0);
    },
    closeContextMenu(event) {
      console.log('fechou');
      if (
        !event ||
        !event.target.closest('.tools')
      ) {
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
      this.isSelected = !this.isSelected; // Alterna o estado de seleção ao clicar
      this.$emit('item-clicked', { item: this.item, layerIndex: this.layerIndex }); // Emite o evento com o item
    },
    
    startVolumeAdjust(e) {
      // Previne eventos padrão
      e.preventDefault();
      e.stopPropagation();
      
      // Configura o estado de arrasto
      this.isDraggingVolume = true;
      
      // Impede o arrasto da mídia durante o ajuste de volume
      this.$el.setAttribute('draggable', 'false');
      
      // Configura o cursor e previne seleção de texto
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      // Adiciona os listeners para controle do volume
      window.addEventListener('mousemove', this.handleVolumeAdjust);
      window.addEventListener('mouseup', this.stopVolumeAdjust);
      
      // Faz o ajuste inicial do volume
      this.handleVolumeAdjust(e);
    },
    
    handleVolumeAdjust(e) {
      if (!this.isDraggingVolume) return;
      
      // Previne eventos padrão e propagação
      e.preventDefault();
      e.stopPropagation();
      
      // Calcula a posição relativa do mouse em relação à barra
      const container = this.$el.querySelector('.volume-bar-container');
      const rect = container.getBoundingClientRect();
      
      // Adiciona margens de segurança para facilitar chegar em 0 e 100
      const effectiveLeft = rect.left + 7;  // 7px de margem
      const effectiveRight = rect.right - 7;
      const effectiveWidth = effectiveRight - effectiveLeft;
      
      // Limita a posição do mouse dentro da área efetiva
      const mouseX = Math.min(Math.max(e.clientX, effectiveLeft), effectiveRight);
      
      // Calcula o volume baseado na posição relativa
      const relativeX = mouseX - effectiveLeft;
      let newVolume = relativeX / effectiveWidth;
      
      // Ajusta os extremos para facilitar chegar em 0 e 100
      if (newVolume < 0.05) newVolume = 0;
      if (newVolume > 0.95) newVolume = 1;
      
      // Arredonda para 2 casas decimais
      newVolume = Math.round(newVolume * 100) / 100;
      
      // Emite o evento apenas se o volume mudou
      if (newVolume !== this.currentVolume) {
        this.$emit('update-volume', {
          item: this.item,
          volume: newVolume
        });
      }
    },
    
    handleBarClick(e) {
      // Apenas responde ao duplo clique
      const container = this.$el.querySelector('.volume-bar-container');
      if (!container) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const rect = container.getBoundingClientRect();
      const mouseX = Math.min(Math.max(e.clientX, rect.left), rect.right);
      const relativeX = mouseX - rect.left;
      
      let newVolume = relativeX / rect.width;
      newVolume = Math.round(Math.max(0, Math.min(1, newVolume)) * 100) / 100;
      
      this.$emit('update-volume', {
        item: this.item,
        volume: newVolume
      });
      
      // Mover a agulha de tempo apenas no duplo clique
      this.$emit('item-clicked', { item: this.item, layerIndex: this.layerIndex });
    },
    
    stopVolumeAdjust(e) {
      if (!this.isDraggingVolume) return;
      
      // Previne eventos padrão
      e.preventDefault();
      e.stopPropagation();
      
      this.isDraggingVolume = false;
      window.removeEventListener('mousemove', this.handleVolumeAdjust);
      window.removeEventListener('mouseup', this.stopVolumeAdjust);
      
      // Limpa os estados
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      this.$el.setAttribute('draggable', 'true');
      
      // Garante uma última atualização de volume
      this.handleVolumeAdjust(e);
    }
  },
  computed: {
    itemWidth() {
      const secondsPerPixel = this.minimumScaleTime / 10; // Ajuste conforme necessário
      return this.item.duration / secondsPerPixel;
    },
    isAudioItem() {
      // Verifica se o item é uma instância da classe Audio
      return this.item instanceof Audio;
    },
    currentVolume() {
      return this.item.volume || 1;
    }
  }
};
</script>

<style scoped>
.audio-waveform-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}



.timeline-item.dragging {
  opacity: 0.7;
  transform: scale(0.95);
  transition: all 0.3s ease;
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Centraliza os itens dentro do contêiner */
  background-color: #fff;
  border-radius: 8px;
  /* Arredondar mais os cantos */
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  /* Suaviza a transição de fundo e de transformação */
  height: 60px;
  /* Altura específica */
  overflow: hidden;
  /* Esconde a parte da imagem que ultrapassa o contêiner */
  position: relative;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  /* Adiciona sombra suave */
}

img {
  width: 100%;
  height: 100%;
  /* Ajuste a altura para preencher o contêiner */
  object-fit: cover;
  /* Ajusta a imagem para cobrir o contêiner */
  object-position: center;
  /* Centraliza a imagem */
  border-radius: 8px;
  /* Arredondar a imagem */
}

.timeline-item:hover {
  background-color: #f0f0f0;
  transform: scale(1);
  /* Aumenta um pouco o item ao passar o mouse */
}

/* Estilo para o item selecionado */
.timeline-item.selected {
  background-color: #d0f0c0;
  border: 2px solid #4caf50;
  position: relative;
}

/* Estilo para a barra de volume horizontal */
.volume-bar-container {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 8px;
  height: 6px;
  background-color: rgba(0, 0, 0, 0.2);
  cursor: pointer !important;
  z-index: 100;
  border-radius: 3px;
  pointer-events: auto;
  padding: 8px 0;
  margin-bottom: -8px;
}

.timeline-item.selected .volume-bar-container {
  pointer-events: all;
}

.volume-bar-fill {
  position: absolute;
  left: 0;
  top: 8px; /* Considera o padding */
  height: 6px;
  background-color: #4caf50;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.volume-knob {
  position: absolute;
  top: 11px; /* Centraliza considerando o padding */
  width: 14px;
  height: 14px;
  background-color: #fff;
  border: 2px solid #4caf50;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 101;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.volume-knob:hover {
  transform: translateX(-50%) scale(1.2);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.volume-knob.dragging {
  cursor: grabbing !important;
  transform: translateX(-50%) scale(1.3);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  background-color: #e8f5e9;
}

.volume-bar-container {
  cursor: default !important;
}

.volume-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  pointer-events: none;
  white-space: nowrap;
  font-weight: 500;
}

.volume-knob:hover .volume-value,
.volume-knob.dragging .volume-value {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}

.volume-bar-container:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.volume-knob:hover {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.volume-knob.dragging {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  cursor: grabbing;
}
</style>