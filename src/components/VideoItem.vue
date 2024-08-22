<template>
  <div class="video-item">
    <video :src="video.url" controls></video>
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
    }
  },
  computed: {
    formatedDuration() {
      return this.formatDuration(this.video.duration);
    },
    truncatedName() {
      const maxLength = 20; // Comprimento máximo incluindo a extensão
      const name = this.video.name;
      const extension = '.mp4';
      let truncatedName = '';

      if (name.length + extension.length > maxLength) {
        // Calcular o comprimento máximo para o nome do vídeo, levando em conta a extensão
        const truncatedLength = maxLength - extension.length;
        // Truncar o nome do vídeo
        truncatedName = name.substring(0, truncatedLength) + '...';
        // Adicionar a extensão
        truncatedName += extension;
      } else {
        // Nome não precisa ser truncado
        truncatedName = name + extension;
      }

      return truncatedName;
    }
  },
  methods: {
    formatDuration(durationInSeconds) {
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = Math.floor(durationInSeconds % 60);

      console.log("batata");
      console.log(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
};

  </script>
  
  <style scoped>
  .video-item {
    margin-bottom: 20px;
    width: 250px;
    height: 100;
  }
  .video-info {
    display: flex;
    justify-content: space-between;
  }
  .video-name {
  display: block;
  max-width: 200px; /* tamanho do titulo */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  </style>