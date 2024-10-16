<template>
    <div
      class="timeline-item"
      @click="handleClick"  
      :style="{ width: itemWidth + 'px' }"
      :class="{ selected: isSelected }"  
    >
      <img class="item-content" :src="item.url" />
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
    data() {
      return {
        isSelected: false, // Estado de seleção
      };
    },
    methods: {
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
  .timeline-item {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    height: 45px; /* Altura específica */
    overflow: hidden; /* Esconde a parte da imagem que ultrapassa o contêiner */
    position: relative;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Ajusta a imagem para cobrir o contêiner */
    object-position: center; /* Centraliza a imagem */
  }
  
  .timeline-item:hover {
    background-color: #f0f0f0;
  }
  
  /* Estilo para o item selecionado */
  .timeline-item.selected {
    background-color: #d0f0c0; /* Cor de destaque para item selecionado */
    border: 2px solid #4caf50; /* Adiciona uma borda verde ao item selecionado */
  }
  </style>
  