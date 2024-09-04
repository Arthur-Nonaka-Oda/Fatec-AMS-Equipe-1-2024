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
    },
  },
  methods: {
    formatDuration(durationInSeconds) {
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      console.log("batata");
      console.log(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    handleAddButtonClick() {
      // this.$timeline.addVideo(this.video);
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
    },
    formatedDuration() {
      const hours = Math.floor(this.video.duration / 3600);
      const minutes = Math.floor((this.video.duration % 3600) / 60);
      const seconds = Math.floor(this.video.duration % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.video-item {
  display: grid;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 10px;
  width: 100%;
  /* width: 400px; */
  height: 100%;
}

.video-player {
  display: grid;
  flex-direction: column;
  justify-content: space-between;
  /* width: 50%; */
  width: 12vw;
  height: auto;
  /* Mantém a proporção do vídeo */
}

.video-info {
  display: flex;
  flex-direction: column;
  /* Organiza as informações em coluna */
  justify-content: space-between;
  margin-top: 5px;
  /* Espaço acima das informações do vídeo */
}

.video-name {
  display: block;
  max-width: 200px;
  /* Tamanho do título */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-duration,
.video-size {
  display: block;
  font-size: 0.9em;
  /* Tamanho menor para duração e tamanho */
}
</style>
