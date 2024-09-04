<!-- Áudio -->
<template>
    <div class="audio-item" @click="handleAddButtonClick">
      <audio :src="audio.url" controls class="audio-player"></audio>
      <div class="audio-info">
        <span class="audio-name">{{ truncatedName }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      audio: {
        type: Object,
        required: true
      },
      showDetails: {
        type: Boolean,
        default: false // Ocultar detalhes por padrão
      }
    },
    methods: {
      handleAddButtonClick() {
        // this.$timeline.addAudio(this.audio);
        this.$emit('add-audio', this.audio);
      },
    },
    computed: {
      truncatedName() {
        const maxLength = 15;
        const name = this.audio.name;
        if (name.length > maxLength) {
          return name.substring(0, maxLength) + '...';
        }
        return name;
      },
    }
  };
  </script>
  
  <style scoped>
  .audio-item {
    display: grid;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 10px;
    width: 100%;
    height: 100%;
  }
  
  .audio-player {
    display: grid;
    flex-direction: column;
    justify-content: space-between;
    width: 12vw;
    height: auto;
  }
  
  .audio-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-top: 5px;
  }
  
  .audio-name {
    display: block;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  </style>
  
 