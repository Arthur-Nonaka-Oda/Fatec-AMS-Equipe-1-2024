<template>
  <div class="image-item" @click="handleAddButtonClick" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <img :src="image.url" alt="Imagem" class="image-display" />
    <div class="image-info">
      <span class="image-name">{{ truncatedName }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagemItem',
  props: {
    image: {
      type: Object,
      required: true
    }
  },
  computed: {
    truncatedName() {
      const maxLength = 15;
      const name = this.image.name;
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...';
      }
      return name;
    }
  },
  methods: {
    handleAddButtonClick() {
      this.$emit('add-image', this.image);
    },
    handleTransformToVideo() {
      // Emite o evento para transformar a imagem em vídeo
      const videoItem = {
        name: this.image.name,
        duration: this.image.duration || 5, // Duração padrão para o vídeo
        type: "video",
        url: this.image.url // Supondo que a imagem tenha uma URL
      };
      this.$emit('transform-to-video', videoItem);
    },
    handleDragStart(event) {
      event.dataTransfer.setData('image', JSON.stringify(this.image));
      this.$emit('drag-start', this.image);
    },
    handleDragEnd() {
      this.$emit('drag-end', this.image);
    }
  },
  
};
</script>

<style scoped>
.image-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px); /* Ajusta para duas colunas com espaçamento */
  box-sizing: border-box; /* Inclui padding e border no cálculo da largura */
}

.image-display {
  width: 100%;
  height: auto;
}

.image-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 5px;
}

.image-name {
  display: block;
  max-width: 13.89vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
