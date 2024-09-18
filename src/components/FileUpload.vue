<template>
  <div>
    <button id="importButton" class="btn-acao" data-acao="importar" @click="openFileDialog" aria-label="Importar">
      <img src="/importarIcone.png" alt="Importar">
      <span class="legenda" id="importar">Importar</span>
    </button>
    <input type="file" ref="fileInput" @change="handleFileUpload" multiple style="display: none;" />
  </div>
</template>

<script>
export default {
  methods: {
    openFileDialog() {
      this.$refs.fileInput.click();
    },
    handleFileUpload(event) {
      const files = event.target.files;
      Array.from(files).forEach(file => {
        const fileType = this.getFileType(file);
        if (fileType === 'video') {
          this.handleVideoFile(file);
        } else if (fileType === 'image') {
          this.handleImageFile(file);
        } else if (fileType === 'audio') {
          this.handleAudioFile(file);
        } else {
          console.log('Unsupported file type:', file.type);
        }
      });
    },
    getFileType(file) {
      const mimeType = file.type;
      if (mimeType.startsWith('video/')) {
        return 'video';
      } else if (mimeType.startsWith('image/')) {
        return 'image';
      } else if (mimeType.startsWith('audio/')) {
        return 'audio';
      } else {
        return 'unsupported';
      }
    },
    getVideoDuration(file) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve(video.duration);
        };

        video.src = URL.createObjectURL(file);
      })
    },
    getImageResolution(file) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ xResolution: img.naturalWidth, yResolution: img.naturalHeight });
        };
        img.src = URL.createObjectURL(file);
      });
    },
    getAudioDuration(file) {
      return new Promise((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';

        audio.onloadedmetadata = () => {
          window.URL.revokeObjectURL(audio.src);
          resolve(audio.duration);
        };

        audio.src = URL.createObjectURL(file);
      });
    },
    async handleAudioFile(file) {
      if (!file) return;
      console.log(file);

      const duration = await this.getVideoDuration(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      this.$files.addAudio({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: file });
    },
    async handleImageFile(file) {
      if (!file) return;
      console.log(file);
      const { xResolution, yResolution } = await this.getImageResolution(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      this.$files.addImage({ filePath: file.path, name: file.name, xResolution: xResolution, yResolution: yResolution, size: sizeInMB, blob: file });
    },
    async handleVideoFile(file) {
      if (!file) return;
      console.log(file);

      const duration = await this.getVideoDuration(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      this.$files.addVideo({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: file });
    },
    
  }
}
</script>

<style scoped>
/* Estilos específicos para o componente FileUpload */
</style>