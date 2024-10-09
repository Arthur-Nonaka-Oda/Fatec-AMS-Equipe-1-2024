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
  mounted() {
    window.electron.ipcRenderer.on('video-saved', this.importVideo);
  },
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
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (isFinite(video.duration) && video.duration > 0) {
            resolve(video.duration);
          } else {
            reject('Invalid video duration.');
          }
        };

        video.onerror = () => {
          reject('Error loading video file.');
        };

        video.src = URL.createObjectURL(file);
      });
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

    getVideoThumbnail(blobUrl) {
      return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        const canvasElement = document.createElement('canvas');
        const context = canvasElement.getContext('2d');
        console.log(videoElement.duration);

        videoElement.onloadeddata = function () {
          if (isFinite(videoElement.duration) && videoElement.duration > 0) {
            videoElement.currentTime = videoElement.duration / 2;
          } else {
            reject('Invalid video duration.');
          }
        };

        videoElement.onseeked = function () {
          context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
          const thumbnailUrl = canvasElement.toDataURL('image/png');
          resolve(thumbnailUrl);
        };

        videoElement.onerror = function () {
          reject('Error loading video file.');
        };

        videoElement.src = blobUrl;
      });
    },
    async handleAudioFile(file) {
      if (!file) return;
      console.log(file);

      const duration = await this.getAudioDuration(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      this.$files.addAudio({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: file });
    },
    async handleImageFile(file) {
      if (!file) return;
      console.log(file);
      const { xResolution, yResolution } = await this.getImageResolution(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const thumbnailURL = URL.createObjectURL(file);

      this.$files.addImage({ filePath: file.path, name: file.name, xResolution: xResolution, yResolution: yResolution, size: sizeInMB, blob: file, url: thumbnailURL });
    },
    async handleVideoFile(file) {
      console.log(file);
      if (!file) return;

      const duration = await this.getVideoDuration(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const thumbnailURL = await this.getVideoThumbnail(URL.createObjectURL(file));
      // const thumbnailURL = "teste";

      this.$files.addVideo({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: file, url: thumbnailURL });
    },
    async getVideoThumbnailElectron (blobUrl) {
        return new Promise((resolve, reject) => {
          const videoElement = document.createElement('video');
          const canvasElement = document.createElement('canvas');
          const context = canvasElement.getContext('2d');
      
          videoElement.onloadeddata = function () {
            videoElement.currentTime = videoElement.duration / 2;
          };
      
          videoElement.onseeked = function () {
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            const thumbnailUrl = canvasElement.toDataURL('image/png');
            resolve(thumbnailUrl);
          };
      
          videoElement.onerror = function () {
            reject('Error loading video file.');
          };
      
          videoElement.src = blobUrl;
        });
      },
    async importVideo({ filePath, data }) {
      const blob = new Blob([Uint8Array.from(atob(data), c => c.charCodeAt(0))], { type: 'video/webm' });
      blob.name = filePath.split('/').pop();
      blob.path = filePath;

        console.log(blob);

      const duration = await this.getVideoDuration(URL.createObjectURL(blob));
      const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
      const thumbnailURL = await this.getVideoThumbnail(URL.createObjectURL(blob));

      this.$files.addVideo({ filePath: blob.path, name: blob.name, duration: duration, size: sizeInMB, blob: blob, url: thumbnailURL });
    },

  }
}
</script>

<style scoped>
/* Estilos específicos para o componente FileUpload */
</style>