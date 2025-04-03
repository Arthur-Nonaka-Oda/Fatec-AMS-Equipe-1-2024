<template>
    <div
    class="timeline-item"
    @click="handleClick"  
    :style="{ width: itemWidth + 'px' }"
    :class="{ selected: selectedItem.item === item }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
  <template v-if="item.type === 'audio'">
     <div class="audio-icon">Audio</div>
   </template>
   <template v-else>
     <img class="item-content" :src="item.url" alt="Conteúdo" />
   </template>
    </div>
  </template>
   
  <script>
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
    created() {
      console.log(this.selectedItem);
      console.log(this.item);
    },
    data() {
      return {
        isDragging: false,
        isSelected: false, // Estado de seleção
      };
    },
    methods: {
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
      }
    },
    computed: {
      itemWidth() {
        const secondsPerPixel = this.minimumScaleTime / 10; // Ajuste conforme necessário
        return this.item.duration / secondsPerPixel;
      }
    }
  };
  </script>
   
  <style scoped>
.audio-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #ddd;
  color: #333;
  font-weight: bold;
}



  .timeline-item.dragging {
  opacity: 0.7;
  transform: scale(0.95);
  transition: all 0.3s ease;
}
  .timeline-item {
    display: flex;
    flex-direction: column;
    align-items: center; /* Centraliza os itens dentro do contêiner */
    background-color: #fff;
    border-radius: 8px; /* Arredondar mais os cantos */
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s; /* Suaviza a transição de fundo e de transformação */
    height: 60px; /* Altura específica */
    overflow: hidden; /* Esconde a parte da imagem que ultrapassa o contêiner */
    position: relative;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Adiciona sombra suave */
  }
   
  img {
    width: 100%;
    height: 100%; /* Ajuste a altura para preencher o contêiner */
    object-fit: cover; /* Ajusta a imagem para cobrir o contêiner */
    object-position: center; /* Centraliza a imagem */
    border-radius: 8px; /* Arredondar a imagem */
  }
   
  .timeline-item:hover {
    background-color: #f0f0f0;
    transform: scale(1.02); /* Aumenta um pouco o item ao passar o mouse */
  }
   
  /* Estilo para o item selecionado */
  .timeline-item.selected {
    background-color: #d0f0c0; /* Cor de destaque para item selecionado */
    border: 2px solid #4caf50; /* Adiciona uma borda verde ao item selecionado */
    transform: scale(1.05); /* Aumenta o item selecionado */
  }
  </style>