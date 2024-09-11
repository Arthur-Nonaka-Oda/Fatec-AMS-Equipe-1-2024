<template>
  <div class="image-item">
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
  }
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
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
