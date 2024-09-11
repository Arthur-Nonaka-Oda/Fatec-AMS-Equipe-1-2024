<template>
  <div class="video-item" @click="handleAddButtonClick" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <video :src="video.url" controls class="video-player"></video>
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
  margin-bottom: 10px;
  width: calc(50% - 10px); /* Ajuste para duas colunas com espaçamento */
}

.video-player {
  width: 100%;
  height: auto;
}

.video-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 5px;
}

.video-name {
  display: block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
