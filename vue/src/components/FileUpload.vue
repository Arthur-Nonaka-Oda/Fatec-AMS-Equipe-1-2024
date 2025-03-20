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
  created() {
    this.importVideos();
  },
  methods: {
    openFileDialog() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(event) {
      const files = Array.from(event.target.files);
      const promises = files.map(file => {
        const fileType = this.getFileType(file);
        if (fileType === 'video') {
          return this.handleVideoFile(file);
        } else if (fileType === 'image') {
          return this.handleImageFile(file);
        } else if (fileType === 'audio') {
          return this.handleAudioFile(file);
        } else {
          console.log('Unsupported file type:', file.type);
          return Promise.resolve();
        }
      });

      await Promise.all(promises);
      console.log('All files processed');
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

    getVideoThumbnail(blobUrl, duration) {
      return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        const canvasElement = document.createElement('canvas');
        const context = canvasElement.getContext('2d');

        videoElement.onloadeddata = function () {
          if (isFinite(duration) && duration > 0) {
            videoElement.currentTime = duration / 2;
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

      if (file.type === 'image/x-icon') {
        console.log('Ignoring .ico file');
        return;
      }

      const videoBase64 = await window.electron.ipcRenderer.invoke('create-video-from-image', {
        filePath: file.path,
        duration: 5
      });

      const byteCharacters = atob(videoBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const videoBlob = new Blob([byteArray], { type: 'video/mp4' });

      const duration = await this.getVideoDuration(videoBlob);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const thumbnailURL = await this.getVideoThumbnail(URL.createObjectURL(videoBlob), duration);

      this.$files.addImage({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: videoBlob, url: thumbnailURL });
    },
    async handleVideoFile(file) {
      console.log(file);
      if (!file) return;

      const duration = await this.getVideoDuration(file);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const thumbnailURL = await this.getVideoThumbnail(URL.createObjectURL(file), duration);

      this.$files.addVideo({ filePath: file.path, name: file.name, duration: duration, size: sizeInMB, blob: file, url: thumbnailURL });
    },
    // async getVideoThumbnailElectron (blobUrl) {
    //     return new Promise((resolve, reject) => {
    //       const videoElement = document.createElement('video');
    //       const canvasElement = document.createElement('canvas');
    //       const context = canvasElement.getContext('2d');

    //       videoElement.onloadeddata = function () {
    //         videoElement.currentTime = videoElement.duration / 2;
    //       };

    //       videoElement.onseeked = function () {
    //         context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    //         const thumbnailUrl = canvasElement.toDataURL('image/png');
    //         resolve(thumbnailUrl);
    //       };

    //       videoElement.onerror = function () {
    //         reject('Error loading video file.');
    //       };

    //       videoElement.src = blobUrl;
    //     });
    //   },
    async importVideos() {
      const data = await window.electron.ipcRenderer.invoke('videos-recorded');
      for (const videoData of data) {
        const byteCharacters = atob(videoData.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'video/mp4' });
        const blobUrl = URL.createObjectURL(blob);

        const videoElement = document.createElement('video');
        videoElement.src = blobUrl;
        videoElement.onloadeddata = async () => {
          const duration = videoElement.duration;
          const thumbnailUrl = await this.getVideoThumbnail(blobUrl, duration);

          const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
          this.$files.addVideo({ filePath: videoData.filePath, name: 'Imported video', duration: duration, size: sizeInMB, blob: blob, url: thumbnailUrl });
        };
        videoElement.onerror = () => {
          console.error('Error loading video from Blob');
        };
      }
    },
    async importVideo({ data, filePath }) {
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      const videoElement = document.createElement('video');
      videoElement.src = blobUrl;
      videoElement.onloadeddata = async () => {
        const duration = videoElement.duration;
        const thumbnailUrl = await this.getVideoThumbnail(blobUrl, duration);

        const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);

        this.$files.addVideo({ filePath: filePath, name: 'Imported video', duration: duration, size: sizeInMB, blob: blob, url: thumbnailUrl });
      };
      videoElement.onerror = () => {
        console.error('Error loading video from Blob');
      };
    },
  }
}
</script>

<style scoped>
/* Estilos específicos para o componente FileUpload */
</style>