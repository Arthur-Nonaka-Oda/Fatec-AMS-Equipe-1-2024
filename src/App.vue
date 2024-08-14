<template>
  <div>
    <header>
      <div class="barra-superior">
        <div class="esquerda" id="importButtons">
          <!-- <button id="importButton" class="btn-acao" data-acao="importar" @click="importFile" aria-label="Importar">
            <img src="/importarIcone.png" alt="Importar">
            <span class="legenda" id="importar">Importar</span>
          </button> -->
          <FileUpload/>
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
          <button :disabled="!isRecording" class="btn-acao" id="pauseButton" @click="pauseRecording" :style="{ opacity: isRecording ? 1 : 0.5 }" data-acao="pause" aria-label="Pause">
            <img :src="pauseImageSrc" alt="Pause">
            <span class="legenda">{{ isPaused ? 'Retomar' : 'Pausar' }}</span>
          </button>
        </div>
      </div>
    </header>

    <section class="secao-principal">
      <div class="area-visualizacao">
        <div class="esquerda">
          <div class="miniatura-video" id="videos">
            <div id="tab" class="texto-escrito-midia">
              <div v-for="video in videosItems" :key="video.id">
              <VideoItem :video="video" />
            </div>
              <!-- <span class="legendaPrincipal">Vídeos<br></span>
              <button class="botao-com-imagem">
                <video poster="/campo.png" controls></video>
              </button>
              <div class="informacoes-video">
                <span class="legendaVideo">nome dele.mp4<br></span>
                <span class="tempo-video">00:10</span>
                <span class="tamanho-video">2 MB</span>
              </div>
              <span class="legendaPrincipal"><br>Audios<br></span>
              <audio autoplay controls>
                <source src="/audioTeste.mp3" type="audio/mp3">
                Seu navegador não suporta HTML5.
              </audio> -->
            </div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="video">
          <!-- Conteúdo do vídeo -->
        </div>
        <div class="rodape">
          <p>00:00:00</p>
        </div>
      </div>
      <div class="linha-do-tempo">
        <div id="playarea">
          <div id="play" @click="playTrigger"></div>
        </div>
        <div id="markerback"></div>
        <div id="timeline" @mousemove="grabMove" @mouseup="grabDone">
          <div id="timecursor" class="noselect" @mousedown="grabTime">00:00:00</div>
          <div id="timemarker"></div>
          <div id="layers"></div>
        </div>
        <div id="timeback"></div>
      </div>
    </section>
  </div>
</template>

<script>
import FileUpload from './components/FileUpload.vue';
import VideoItem from './components/VideoItem.vue';
import './assets/main.css';

export default {
  name: 'App',
  components: {
    FileUpload,
    VideoItem
  },
  data() {
    return {
      isRecording: false,
      isPaused: false,
      recordImageSrc: '/recordIcon.png',
      pauseImageSrc: '/pauseIcon.png',
      videosItems: []
    };
  },
  created() {
    this.videosItems = this.$files.getFiles();
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
    playTrigger() {
      // Implementar lógica de reprodução
    },
    grabMove() {
      // Implementar lógica de movimento
    },
    grabDone() {
      // Implementar lógica de finalização de movimento
    },
    grabTime() {
      // Implementar lógica de captura de tempo
    }
  }
};
</script>