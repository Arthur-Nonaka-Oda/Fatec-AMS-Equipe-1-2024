<template>
  <div class="video-item">
    <video :src="video.url" controls class="video-player"></video>
    <div class="video-info">
      <span class="video-name">{{ truncatedName }}</span>
      <span v-if="showDetails" class="video-duration">{{ formatedDuration }}</span>
      <span v-if="showDetails" class="video-size">{{ video.size }} MB</span>
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
    showDetails: {
      type: Boolean,
      default: false // Ocultar detalhes por padrão
    }
  },
  computed: {
    truncatedName() {
      const maxLength = 20;
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
  margin-bottom: 20px;
  width: 180px;
}

.video-player {
  width: 100%; /* Ajusta o vídeo para ocupar toda a largura do container */
  height: auto; /* Mantém a proporção do vídeo */
}

.video-info {
  display: flex;
  flex-direction: column; /* Organiza as informações em coluna */
  justify-content: space-between;
  margin-top: 5px; /* Espaço acima das informações do vídeo */
}

.video-name {
  display: block;
  max-width: 200px; /* Tamanho do título */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-duration, .video-size {
  display: block;
  font-size: 0.9em; /* Tamanho menor para duração e tamanho */
}
</style>
