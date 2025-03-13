<template>
  <div class="media-tabs">
    <!-- Abas de Navegação -->
    <div class="tabs">
      <button :class="{ active: activeTab === 'Vídeos' }" @click="activeTab = 'Vídeos'">Vídeos</button>
      <button :class="{ active: activeTab === 'Áudios' }" @click="activeTab = 'Áudios'">Áudios</button>
      <button :class="{ active: activeTab === 'Imagens' }" @click="activeTab = 'Imagens'">Imagens</button>
    </div>

    <!-- Conteúdo das Abas -->
    <div v-if="activeTab === 'Vídeos'" class="video-container">
      <VideoItem 
        v-for="(video, index) in videos" 
        :key="index" 
        :video="video" 
        @add-video="addVideo" 
      />
    </div>
    <div v-if="activeTab === 'Áudios'" class="audio-container">
      <AudioItem 
        v-for="(audio, index) in audios" 
        :key="index" 
        :audio="audio" 
        @add-audio="addAudio" 
      />
    </div>
    <div v-if="activeTab === 'Imagens'" class="imagem-container">
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
      videos: this.$files.getFiles().videos, // Método para obter vídeos
      audios: this.$files.getFiles().audios, // Método para obter áudios
      images: this.$files.getFiles().images, // Método para obter imagens
    };
  },
  methods: {
    addVideo(video) {
      this.$emit('add-file', {file: video, layerIndex: 0, type: 'video'});
    },
    addAudio(audio) {
      this.$emit('add-file', {file: audio, layerIndex: 1, type: 'audio'});
    },
    addImage(image) {
      this.$emit('add-file', {file: image, layerIndex: 0, type: 'image'});
    }
  }
};
</script>

<style scoped>
.tabs {
  display: flex;
  width: 100%;
  padding: 1.11vh 2.22vh; /* ou 0.69vw 1.39vw, dependendo da orientação */
  margin-bottom: 1.11vh; /* ou 0.69vw */
  justify-content: center;
}

.tabs button {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #FFFFFF; 
  color: #000000; 
  border: none;
  padding: 0.3125rem 0.625rem;
font-size: 0.8125rem;
margin-right: 0.3125rem;
border-radius: 0.5rem;

  cursor: pointer; /* Cursor de mão ao passar sobre */
  transition: background-color 0.3s; 
}

.tabs button.active {
  background-color: #4F8DFF; 
  color: #FFFFFF;
}

.video-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 22.92vw; /* Para max-width */
  gap: 0.625rem;      /* Para o espaço entre os vídeos */
  justify-content: space-between;
}


.imagem-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 330px;
  gap: 10px; /* Espaço entre os vídeos */
  justify-content: space-between;
}
</style>
