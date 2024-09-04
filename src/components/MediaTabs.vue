<template>
    <div class="media-tabs">
      <!-- Abas de Navegação -->
      <div class="tabs">
        <button :class="{ active: activeTab === 'Vídeos' }" @click="activeTab = 'Vídeos'">Vídeos</button>
        <button :class="{ active: activeTab === 'Áudios' }" @click="activeTab = 'Áudios'">Áudios</button>
        <button :class="{ active: activeTab === 'Imagens' }" @click="activeTab = 'Imagens'">Imagens</button>
      </div>
  
      <!-- Conteúdo das Abas -->
      <div v-if="activeTab === 'Vídeos'">
        <VideoItem 
          v-for="(video, index) in videos" 
          :key="index" 
          :video="video" 
          @add-video="addVideo" 
        />
      </div>
      <div v-if="activeTab === 'Áudios'">
        <AudioItem 
          v-for="(audio, index) in audios" 
          :key="index" 
          :audio="audio" 
          @add-audio="addAudio" 
        />
      </div>
      <div v-if="activeTab === 'Imagens'">
        <ImagemItem 
          v-for="(image, index) in images" 
          :key="index" 
          :image="image" 
          @add-image="addImage" 
        />
      </div>
    </div>
  </template>
  
  <script>
  import VideoItem from './VideoItem.vue';
  import AudioItem from './AudioItem.vue';
  import ImagemItem from './ImagemItem.vue';
  
  export default {
    name: 'MediaTabs',
    components: {
      VideoItem,
      AudioItem,
      ImagemItem
    },
    data() {
      return {
        activeTab: 'Vídeos',
        videos: this.$files.getFiles('video'), // Método para obter vídeos
        audios: this.$files.getFiles('audio'), // Método para obter áudios
        images: this.$files.getFiles('image'), // Método para obter imagens
      };
    },
    methods: {
      addVideo(video) {
        this.$emit('add-video', video);
      },
      addAudio(audio) {
        this.$emit('add-audio', audio);
      },
      addImage(image) {
        this.$emit('add-image', image);
      }
    }
  };
  </script>
  
  <style scoped>
  .tabs {
    display: flex;
    margin-bottom: 10px;
  }
  
  .tabs button {
    padding: 10px;
    cursor: pointer;
    background-color: #FFFFFF; /* White background */
    color: #000000; /* Black text */
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
  }
  
  .tabs button.active {
    font-weight: bold;
    background-color: #303A7C; /* Blue background */
    color: #FFFFFF; /* White text */
  }
  </style>
  