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
      videos: this.$files.getFiles().videos, // Método para obter vídeos
      audios: this.$files.getFiles().audios, // Método para obter áudios
      images: this.$files.getFiles().images, // Método para obter imagens
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
  width: 100%;
  padding: 10px 20px;
  margin-bottom: 10px;
  justify-content: center;
}

.tabs button {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: #FFFFFF; 
  color: #000000; 
  border: none;
  padding: 5px 10px;
  font-size: 13px;
  margin-right: 5px;
  border-radius: 8px; /* Bordas arredondadas */
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
  max-width: 330px;
  gap: 10px; /* Espaço entre os vídeos */
  justify-content: space-between;
}
</style>
