<template>
    <div>
      <button id="importButton" class="btn-acao" data-acao="importar" @click="openFileDialog" aria-label="Importar">
        <img src="/importarIcone.png" alt="Importar">
        <span class="legenda" id="importar">Importar</span>
      </button>
      <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none;" />
    </div>
  </template>
  
  <script>
  
  export default {
    data() {
      return {
        file: null
      };
    },
    methods: {
      openFileDialog() {
        this.$refs.fileInput.click();
      },
      handleFileUpload(event) {
        this.file = event.target.files[0];
        this.submitFile();
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
      async submitFile() {
        if (!this.file) return;
        console.log(this.file);
  
        // const formData = new FormData();
        // formData.append('file', this.file);

        const duration = await this.getVideoDuration(this.file);
        const sizeInMB = (this.file.size / (1024 * 1024)).toFixed(2); 

        this.$files.addFile({filePath: this.file.path, name: this.file.name,duration: duration, size: sizeInMB, blob: this.file});
  
        
      }
    }
  }
  </script>
  
  <style scoped>
  /* Estilos específicos para o componente FileUpload */
  </style>