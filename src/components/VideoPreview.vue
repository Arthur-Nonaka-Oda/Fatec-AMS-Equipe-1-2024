<template>
  <div class="video">
    <div class="video-container">
      <video ref="videoPlayer" poster="/pirataria.jpg" @timeupdate="updateTime" @loadedmetadata="updateDuration">
        <source src="/videoTrigo.mp4" type="video/mp4" />
        Seu navegador não suporta a exibição de vídeos.
      </video>
    </div>
    <input type="range" min="0" :max="videoDuration" step="0.1" v-model="currentTime" @input="seekVideo" class="time-slider">
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
          <img src="/volume.png" alt="Audio" class="audio-icon">
        </button>
        <div v-if="showVolumeControl" class="volume-control">
          <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" class="vertical-slider">
        </div>
      </div>
    </div>
  </div>
</template>
 
 

<script>
export default {
  data() {
    return {
      playPauseIcon: "/playIcone.png", // Caminho para o ícone de play
      videoDuration: 0,
      currentTime: 0,
      volume: 1,
      showVolumeControl: false
    };
  },
  computed: {
    formattedTime() {
      return `${this.formatTime(this.currentTime)} / ${this.formatTime(this.videoDuration)}`;
    },
  },
  methods: {
    togglePlayPause() {
      const video = this.$refs.videoPlayer;
      if (video.paused) {
        video.play();
        this.playPauseIcon = "/pauseIcone.png"; // Caminho para o ícone de pause
      } else {
        video.pause();
        this.playPauseIcon = "/playIcone.png"; // Caminho para o ícone de play
      }
    },
    updateVolume() {
      const video = this.$refs.videoPlayer;
      video.volume = this.volume;
    },
    toggleVolumeControl() {
      this.showVolumeControl = !this.showVolumeControl;
    },
    deleteVideo() {
      // Implementar lógica de exclusão
      console.log("Delete video logic here");
    },
    trimVideo() {
      // Implementar lógica de recorte
      console.log("Trim video logic here");
    },
    updateTime() {
      const video = this.$refs.videoPlayer;
      this.currentTime = video.currentTime;
    },
    updateDuration() {
      const video = this.$refs.videoPlayer;
      this.videoDuration = video.duration;
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
  height: 40px;
  padding: 5px;
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
  width: 30px;
  height: auto;
}

.right-controls p {
  margin: 0;
  color: #64c6f0;
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

.play-pause-icon, .audio-icon {
  width: 24px;
  height: 24px;
}

.volume-control {
  position: absolute;
  right: 10px;
  bottom: 50px;
  background: white;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.vertical-slider {
  width: 8px;
  height: 100px;
  writing-mode: bt-lr;
  -webkit-appearance: slider-vertical;
}

 
input[type=range] {
  height: 2px;
  z-index: 1;
  -webkit-appearance: none;
  margin:  0;
  width: 100%;
}
input[type=range]:focus {
  outline: none;
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: #2497E3;
  border-radius: 1px;
  border: 0px solid #000000;
}
input[type=range]::-webkit-slider-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #2497E3;
  height: 18px;
  width: 18px;
  border-radius: 25px;
  background: #A1D0FF;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -7px;
}
input[type=range]:focus::-webkit-slider-runnable-track {
  background: #2497E3;
}
input[type=range]::-moz-range-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  box-shadow: 0px 0px 0px #000000;
  background: #2497E3;
  border-radius: 1px;
  border: 0px solid #000000;
}
input[type=range]::-moz-range-thumb {
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #2497E3;
  height: 18px;
  width: 18px;
  border-radius: 25px;
  background: #A1D0FF;
  cursor: pointer;
}
input[type=range]::-ms-track {
  width: 100%;
  height: 5px;
  cursor: pointer;
  animate: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type=range]::-ms-fill-lower {
  background: #2497E3;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}
input[type=range]::-ms-fill-upper {
  background: #2497E3;
  border: 0px solid #000000;
  border-radius: 2px;
  box-shadow: 0px 0px 0px #000000;
}
input[type=range]::-ms-thumb {
  margin-top: 1px;
  box-shadow: 0px 0px 0px #000000;
  border: 1px solid #2497E3;
  height: 18px;
  width: 18px;
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

</style>
 
