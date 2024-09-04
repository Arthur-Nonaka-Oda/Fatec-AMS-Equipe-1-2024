<template>
<div>
  <header>
    <div class="barra-superior">
      <div class="esquerda" id="importButtons">
        <FileUpload />
        <button class="btn-acao" data-acao="texto" aria-label="Adicionar Texto">
          <img src="/textoIcone.png" alt="Texto">
          <span class="legenda">Texto</span>
        </button>
      </div>
      <div class="centro">
        <button class="btn-acao" data-acao="desfazer" aria-label="Desfazer">
          <img src="/voltarIcone.png" alt="Desfazer">
          <span class="legenda">Desfazer</span>
        </button>
        <button class="btn-acao" data-acao="salvar" aria-label="Salvar">
          <img src="/salvarIcone.png" alt="Salvar">
          <span class="legenda">Salvar</span>
        </button>
      </div>
      <div class="direita" id="recordButtons">
        <button class="btn-acao" id="startButton" data-acao="gravar" @click="toggleRecording" aria-label="Gravar">
          <img id="imagePlay" :src="recordImageSrc" alt="Gravar">
          <span id="textPlay" class="legenda">{{ isRecording ? 'Parar' : 'Gravar' }}</span>
        </button>
        <button :disabled="!isRecording" class="btn-acao" id="pauseButton" @click="pauseRecording"
          :style="{ opacity: isRecording ? 1 : 0.5 }" data-acao="pause" aria-label="Pause">
          <img :src="pauseImageSrc" alt="Pause">
          <span class="legenda">{{ isPaused ? 'Retomar' : 'Pausar' }}</span>
        </button>
      </div>
    </div>
  </header>

  <section class="secao-principal">
    <div class="area-visualizacao">
      <div class="esquerda">
        <MediaTabs @add-video="handleVideoAdded" />
      </div>
      <VideoPreview />
    </div>
    <TimeLine :videos="timeline.videos" :timeline="timeline"/>
  </section>
</div>
</template>

<script>
import FileUpload from './components/FileUpload.vue';
import MediaTabs from './components/MediaTabs.vue';
import TimeLineComponent from './components/TimeLine.vue';
import TimeLine from './models/TimeLine.js';
import VideoPreview from './components/VideoPreview.vue';
import './assets/main.css';

export default {
  name: 'App',
  components: {
    FileUpload,
    MediaTabs,
    TimeLine: TimeLineComponent,
    VideoPreview
  },
  data() {
    return {
      isRecording: false,
      isPaused: false,
      recordImageSrc: '/recordIcon.png',
      pauseImageSrc: '/pauseIcon.png',
      timeline: null
    };
  },
  created() {
    this.timeline = new TimeLine();
  },
  methods: {
    toggleRecording() {
      this.isRecording = !this.isRecording;
      this.recordImageSrc = this.isRecording ? '/stopIcon.png' : '/recordIcon.png';
    },
    pauseRecording() {
      this.isPaused = !this.isPaused;
      this.pauseImageSrc = this.isPaused ? '/playIcon.png' : '/pauseIcon.png';
    },
    handleVideoAdded(video) {
      this.timeline.addVideoToEnd(video);
    }
  }
};
</script>

<style scoped>
</style>
