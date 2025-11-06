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
.media-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 12px;
  justify-content: center;
  gap: 8px;
  background: #ffffff;
  border-bottom: 1px solid #E1E8ED;
}

.tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  color: #4A5568;
  border: none;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 400;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 90px;
}

.tabs button:hover {
  background: transparent;
  color: #0066FF;
}

.tabs button.active {
  background: #0066FF;
  color: #FFFFFF;
  border: none;
}

.video-container,
.audio-container,
.imagem-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  gap: 12px;
  justify-content: flex-start;
  padding: 0 12px 12px;
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

.video-container::-webkit-scrollbar,
.audio-container::-webkit-scrollbar,
.imagem-container::-webkit-scrollbar {
  width: 8px;
}

.video-container::-webkit-scrollbar-track,
.audio-container::-webkit-scrollbar-track,
.imagem-container::-webkit-scrollbar-track {
  background: #F5F7FA;
}

.video-container::-webkit-scrollbar-thumb,
.audio-container::-webkit-scrollbar-thumb,
.imagem-container::-webkit-scrollbar-thumb {
  background: #CBD5E0;
  border-radius: 4px;
}
</style>
