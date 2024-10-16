<template>
  <div class="video">
    <div class="video-container">
      <video ref="videoPlayer" poster="/pirataria.jpg" @timeupdate="updateTime" @loadedmetadata="updateDuration">
        <source :src="videoUrl" type="video/mp4" />
        Seu navegador não suporta a exibição de vídeos.
      </video>
    </div>
    <input type="range" min="0" :max="videoDuration" step="0.1" v-model="currentTime" @input="seekVideo"
      class="time-slider">
    <div class="controles">
      <div class="left-controls">
        <button @click="deleteVideo">
          <img src="/lixoIcone.png" alt="Lixo" />
        </button>
        <button @click="trimVideo">
          <img src="/tesouraIcone.png" alt="Recortar" />
        </button>
      </div>
      <div class="center-controls">
        <button @click="togglePlayPause" class="play-button">
          <img :src="playPauseIcon" alt="Play/Pause" class="play-pause-icon">
        </button>
      </div>
      <div class="right-controls">
        <p>{{ formattedTime }}</p>
        <button @click="toggleVolumeControl" class="audio-button">
        <img :src="volumeIcon" alt="Audio" class="audio-icon"> 
        </button>
        <div v-if="showVolumeControl" class="volume-control">
          <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume"
            class="vertical-slider">
        </div>
        <button @click="toggleFullscreen" class="fullscreen-button">
          <img src="/full.png" alt="Fullscreen" class="fullscreen-icon">
          </button>
      </div>
    </div>
  </div>
</template>



<script>
export default {
  props: {
    videoUrl: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      playPauseIcon: "/playIcone.png",
      videoDuration: 0,
      currentTime: 0,
      volume: 1,
      showVolumeControl: false,
      volumeIcon: "/volume.png"
    };
  },
  computed: {
    formattedTime() {
      return `${this.formatTime(this.currentTime)} / ${this.formatTime(this.videoDuration)}`;
    },
  },
  methods: {
    togglePlayPause() {
      console.log(this.videoUrl);
      const video = this.$refs.videoPlayer;
      if (video.paused) {
        video.play();
        this.playPauseIcon = "/pauseIcone.png";
      } else {
        video.pause();
        this.playPauseIcon = "/playIcone.png";
      }
    },
    updateVolume() {
      const video = this.$refs.videoPlayer;
      video.volume = this.volume;
      this.volumeIcon = this.volume <= 0.0 ? "/mudo.jpg" : "/volume.png";
    },
    toggleVolumeControl() {
      this.showVolumeControl = !this.showVolumeControl;
    },
    deleteVideo() {
      console.log("Delete video logic here");
    },
    trimVideo() {
      console.log("Trim video logic here");
    },
    updateTime() {
      const video = this.$refs.videoPlayer;
      this.currentTime = video.currentTime;
      const slider = this.$el.querySelector('.time-slider');
      slider.style.setProperty('--value', this.currentTime);
      slider.style.setProperty('--max', this.videoDuration);
    },
    updateDuration() {
      const video = this.$refs.videoPlayer;
      this.videoDuration = video.duration;
      const slider = this.$el.querySelector('.time-slider');
      slider.style.setProperty('--value', this.currentTime);
      slider.style.setProperty('--max', this.videoDuration);
    },
    seekVideo() {
      const video = this.$refs.videoPlayer;
      video.currentTime = this.currentTime;
    },
    formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    },
    toggleFullscreen() {
      const video = this.$refs.videoPlayer;
      if (!document.fullscreenElement) {
        video.requestFullscreen().catch(err => {
          console.error(`Erro ao tentar entrar no modo fullscreen: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  },
  mounted() {
    const video = this.$refs.videoPlayer;
    video.addEventListener("timeupdate", this.updateTime);
    video.addEventListener("loadedmetadata", this.updateDuration);
  },
};
</script>

<style scoped>
.video {
  width: 67vw;
  height: 100%;
  height: 61.3vh;
  margin: 0;
  display: flex;
  flex-direction: column;
  right: 0;
}

.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: rgb(65, 65, 65);
}

.video video {
  width: 99%;
  height: 99%;
  object-fit: contain;
}

.controles {
  display: flex;
  align-items: center;
  background-color: #616161;
  height: 5vh; /* Altura em vh, equivalente a aproximadamente 40px em uma tela padrão */
padding: 0.625rem; /* Preenchimento em rem, equivalente a 5px */

  margin-top: auto;
  position: relative;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
}

.center-controls {
  flex: 1;
  display: flex;
  justify-content: center;
}

.left-controls button,
.center-controls button {
  background: none;
  border: none;
  cursor: pointer;
}

.left-controls img,
.center-controls .play-pause-icon {
  width: 2.5vw;
  height: auto;
}

.right-controls p {
  margin: 0;
  color: #ffffff;
  text-align: right;
  width: 100%;
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-button {
  background: none;
  border: none;
  cursor: pointer;
}

.play-pause-icon,
.audio-icon {
  width: 2vw;   /* Largura em vw (aproximadamente 24px) */
height: 4vh;  /* Altura em vh (aproximadamente 24px) */

}

.volume-control input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  height: 1vh;
  background: #011fff;
  border-radius: 0.5rem; /* Raio da borda em rem */

}

.volume-control input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 1vh;
  background: #011fff; /* Cor da linha do controle de volume */
  border-radius: 0.5rem; /* Raio da borda em rem */

}

.volume-control input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: 1px solid #000000; /* Contorno da bolinha */
  height: 1.85vh; /* Altura em vh */
width: 1.04vw;  /* Largura em vw */

  border-radius: 50%;
  background: #ffffff; /* Cor da bolinha */
  cursor: pointer;
}

.volume-control input[type=range]::-moz-range-track {
  width: 100%;
  height: 0.74vh;
  background: #ff0199; /* Cor da linha do controle de volume */
  border-radius: 0.5rem;
}

.volume-control input[type=range]::-moz-range-thumb {
  border: 1px solid #1a0735; /* Contorno da bolinha */
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: #A1D0FF; /* Cor da bolinha */
  cursor: pointer;
}

.volume-control input[type=range]::-ms-track {
  width: 100%;
  height: 2vh;
  background: #ff0199;
  border-color: #ff0199;
  color: #ff0199;
}

.volume-control input[type=range]::-ms-fill-lower {
  background: #ff0199; /* Cor da linha do controle de volume */
  border-radius: 5px;
}

.volume-control input[type=range]::-ms-fill-upper {
  background: #ff0199; /* Cor da linha do controle de volume */
 
  border-radius: 10%;

}

.volume-control input[type=range]::-ms-thumb {
  border: 1px solid #1a0735; /* Contorno da bolinha */
  height: 50px;
  width: 50px;
  border-radius: 50%;
  background: #A1D0FF; /* Cor da bolinha */
  cursor: pointer;
}



input[type=range] {
  height: 4px;
  z-index: 1;
  -webkit-appearance: none;
  margin: 0;
  width: 100%;
  background: linear-gradient(to right, #01ff1f 0%, #01ff1f calc((100% * var(--value)) / var(--max)),
      #2497E3 calc((100% * var(--value)) / var(--max)),
      #2497E3 100%);
}

input[type=range]:focus {
  outline: none;
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 1vh;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: transparent;
  /*linha principal do video */
  border-radius: 1px;
  border: 0px solid #000000;
}

input[type=range]::-webkit-slider-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #1a0735;
  /*contorno da bolinha*/
  height: 15px;
  width: 15px;
  border-radius: 25px;
  background: #A1D0FF;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -7px;
}

input[type=range]:focus::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #01ff1f 0%, #01ff1f calc((100% * var(--value)) / var(--max)),
      #2497E3 calc((100% * var(--value)) / var(--max)),
      #2497E3 100%);
  ;
}

input[type=range]::-moz-range-track {
  width: 100%;
  height: 1vh;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: transparent;
  border-radius: 1px;
  border: 0px solid #000000;
}

input[type=range]::-moz-range-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #c2ff27;
  height: 2vh;
  width: 1vw;
  border-radius: 25px;
  background: #A1D0FF;
  cursor: pointer;
}

input[type=range]::-ms-track {
  width: 100%;
  height: 0.5vh; /* Ajuste conforme necessário */

  cursor: pointer;
  animate: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}

input[type=range]::-ms-fill-lower {
  background: #e3aa24;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}

input[type=range]::-ms-fill-upper {
  background: #e324c6;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}

input[type=range]::-ms-thumb {
  margin-top: 1px;
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #98c1dc;
  height: 2vh;
  width: 1vw;
  border-radius: 25px;
  background: #A1D0FF;
  cursor: pointer;
}

input[type=range]:focus::-ms-fill-lower {
  background: #2497E3;
}

input[type=range]:focus::-ms-fill-upper {
  background: #2497E3;
}

.fullscreen-button {
  background: none;
  border: none;
  cursor: pointer;
}

.fullscreen-icon {
  width: 3vw;
  height: 3vh;
}
</style>
