<template>
  <div class="video-item" @click="handleAddButtonClick" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <img :src="video.url" class="video-player">
    <div class="video-info">
      <span class="video-name">{{ truncatedName }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    video: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleAddButtonClick() {
      this.$emit('add-video', this.video);
    },
    handleDragStart(event) {
      event.dataTransfer.setData('video', JSON.stringify(this.video));
      this.$emit('drag-start', this.video);
    },
    handleDragEnd() {
      this.$emit('drag-end', this.video);
    }
  },
  computed: {
    truncatedName() {
      const maxLength = 15;
      const name = this.video.name;
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...';
      }
      return name;
    }
  }
};
</script>

<style scoped>
.video-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px); /* Ajusta para duas colunas com espaçamento */
  box-sizing: border-box; /* Inclui padding e border no cálculo da largura */
}

.video-item:hover {
  cursor: pointer;
}

.video-player {
  width: 100%;
  height: auto;
}

.video-info { 
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 0.3125rem;  /* Margem superior */

}

.video-name {
  display: block;
  max-width: 13.89vw;  /* Largura máxima */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
