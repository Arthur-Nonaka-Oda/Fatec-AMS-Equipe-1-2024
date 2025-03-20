<template>
  <div class="video">
    <div class="video-container">
      <video ref="videoPlayer" @timeupdate="updateTime" @loadedmetadata="updateDuration">
        <source :src="currentVideo" type="video/mp4" />
        Seu navegador não suporta a exibição de vídeos.
      </video>
    </div>
    <input type="range" min="0" :max="totalDuration" step="0.1" v-model="currentGlobalTime" @input="seekVideo"
      class="time-slider">

    <div class="controles">
      <div class="left-controls">
        <button @click="deleteVideo" class="delete-button">
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
        <p>{{ formattedTime }}</p>
      </div>
      <div class="right-controls">
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
    timeline: {
      type: Object,
      required: false
    }
  },
  data() {
    return {
      currentIndex: 0,
      currentVideo: null,
      playPauseIcon: "../playIcon2.png", // Caminho para o ícone de play
      videoDuration: 0,
      currentTime: 0,
      currentGlobalTime: 0,
      volume: 1,
      showVolumeControl: false,
      volumeIcon: "/volume.png",

    };
  },
  computed: {
    totalDuration() {
      const videos = this.timeline.listFilesInLayer(0);
      return videos.reduce((total, video) => total + video.duration, 0);
    },
    formattedTime() {
      return `${this.formatTime(this.currentGlobalTime)} / ${this.formatTime(this.totalDuration)}`;
    },
  },
  watch: {
    timeline: {
      deep: true,
      handler() {
        this.loadVideo();
      }
    }
  },
  methods: {
    loadVideo() {
      const videos = this.timeline.listFilesInLayer(0);
      if (videos.length > 0) {
        const currentItem = videos[this.currentIndex];
        this.currentVideo = URL.createObjectURL(currentItem.blob);
        const video = this.$refs.videoPlayer;
        this.$nextTick(() => {
          video.currentTime = currentItem.startTime;
          this.updatePlayPauseIcon();
        });
        video.load();
      } else {
        this.currentVideo = null;
        const video = this.$refs.videoPlayer;
        video.load();

        this.updatePlayPauseIcon();
      }
    },
    handleVideoEnded() {
      const videos = this.timeline.listFilesInLayer(0);
      if (this.currentIndex < videos.length - 1) {
        this.currentIndex++;
        this.loadVideo();
        this.$refs.videoPlayer.play();
      } else {
        this.currentIndex = 0;
        const video = this.$refs.videoPlayer;
        this.$nextTick(() => {
          video.currentTime = videos[this.currentIndex].startTime;
          console.log(videos[this.currentIndex].startTime);
          video.pause();
          this.updatePlayPauseIcon();
        })

      }
    },
    togglePlayPause() {
      const video = this.$refs.videoPlayer;
      if (video.paused) {
        video.play();
        this.playPauseIcon = "/pausaicon2.png"; // Atualiza o ícone para "Pause"
      } else {
        video.pause();
        this.playPauseIcon = "/playIcon2.png"; // Atualiza o ícone para "Play"
      }

    },
    updatePlayPauseIcon() {
      const video = this.$refs.videoPlayer;
      this.playPauseIcon = video.paused ? "/playIcon2.png" : "/pausaicon2.png";
    },
    updateVolume() {
      const video = this.$refs.videoPlayer;
      video.volume = this.volume;

      // 
      this.volumeIcon = this.volume <= 0.0 ? "/mudo.png" : "/volume.png";
    },
    toggleVolumeControl() {
      this.showVolumeControl = !this.showVolumeControl;
    },
    deleteVideo() {
      // Implementar lógica de exclusão
      this.$emit('delete-video', this.video);
    },
    trimVideo() {
      this.$emit('trim-video', this.video);
      console.log("Trim video logic here");
    },
    playSegment(startTime, endTime) {
      const video = this.$refs.videoPlayer;
      video.currentTime = startTime;
      video.play();
      this.updatePlayPauseIcon();

      const pauseAtEndTime = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          video.removeEventListener('timeupdate', pauseAtEndTime);
        }
      };

      video.addEventListener('timeupdate', pauseAtEndTime);
    },
    updateTime() {
      const video = this.$refs.videoPlayer;
      const videos = this.timeline.listFilesInLayer(0);
      let accumulated = 0;
      for (let i = 0; i < this.currentIndex; i++) {
        accumulated += videos[i].duration;
      }
      if (videos.length > 0) {
        this.currentGlobalTime = accumulated + (video.currentTime - videos[this.currentIndex].startTime);


        const slider = this.$el.querySelector('.time-slider');
        slider.style.setProperty('--value', this.currentGlobalTime);
        slider.style.setProperty('--max', this.totalDuration);

        const currentVideo = videos[this.currentIndex];
        if (video.currentTime >= currentVideo.endTime) {
          this.handleVideoEnded();
        }
      }
    },
    updateDuration() {
      const video = this.$refs.videoPlayer;
      // Capture the duration of the current video (optional if you need it separately)
      this.videoDuration = video.duration;

      // Update slider styles to reflect the global total duration
      const slider = this.$el.querySelector('.time-slider');
      slider.style.setProperty('--value', this.currentGlobalTime);
      slider.style.setProperty('--max', this.totalDuration);
    },
    seekVideo() {
      // Get all videos and the global slider time
      const videos = this.timeline.listFilesInLayer(0);
      let globalTime = this.currentGlobalTime;
      let accumulated = 0;
      let targetIndex = 0;

      // Determine which video segment the global time corresponds to
      while (targetIndex < videos.length && (accumulated + videos[targetIndex].duration) < globalTime) {
        accumulated += videos[targetIndex].duration;
        targetIndex++;
      }

      // If globalTime exceeds total, use the last video and its duration
      if (targetIndex >= videos.length) {
        targetIndex = videos.length - 1;
        globalTime = videos[targetIndex].duration;
      }

      // If we need to change the video segment
      if (targetIndex !== this.currentIndex) {
        this.currentIndex = targetIndex;

        // Revoke the previous blob URL if needed
        if (this.currentVideo) {
          URL.revokeObjectURL(this.currentVideo);
        }

        const videoBlob = videos[targetIndex].blob;
        const videoDuration = videos[targetIndex].duration;

        // Start and end time from the video's metadata
        const startTime = videos[targetIndex].startTime; // Assume these times are provided in the video metadata
        const endTime = videos[targetIndex].endTime;     // These are the start and end times of the video segment

        // Calculate the byte range for the slice
        const startByte = (startTime / videoDuration) * videoBlob.size;
        const endByte = (endTime / videoDuration) * videoBlob.size;

        // Slice the video blob from startByte to endByte
        const slicedBlob = videoBlob.slice(startByte, endByte, "video/mp4");
        this.currentVideo = URL.createObjectURL(slicedBlob);

        // Load the new video and set its time
        this.$nextTick(() => {
          const video = this.$refs.videoPlayer;
          video.currentTime = 0; // Start from the beginning of the sliced video
          video.load();
          this.updatePlayPauseIcon();
        });

      }
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
    },
  },
  mounted() {
    const video = this.$refs.videoPlayer;
    video.addEventListener("timeupdate", this.updateTime);
    video.addEventListener("loadedmetadata", this.updateDuration);
    video.addEventListener("play", this.updatePlayPauseIcon);
    video.addEventListener("pause", this.updatePlayPauseIcon);
    video.addEventListener("ended", this.handleVideoEnded);
    this.loadVideo();
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
  background-color: rgb(0, 0, 0);
}

.video video {
  width: 99%;
  height: 99%;
  object-fit: contain;
}

.controles {
  display: flex;
  align-items: center;
  background-color: #444444;
  height: 5vh;
  /* Altura em vh, equivalente a aproximadamente 40px em uma tela padrão */
  padding: 0.625rem;
  /* Preenchimento em rem, equivalente a 5px */

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

.center-controls p {
  color: #ffffff;
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
  width: 2.5vw;
  /* Largura em vw (aproximadamente 24px) */
  /*
  height: 4vh;  
  Altura em vh (aproximadamente 24px) */

}

.volume-control input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  height: 1vh;
  background: #ce2323;
  border-radius: 0.5rem;
  /* Raio da borda em rem */

}

.volume-control input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 1vh;
  background: #ce2323;
  /* Cor da linha do controle de volume */
  border-radius: 0.5rem;
  /* Raio da borda em rem */

}

.volume-control input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: none;
  height: 3vh;
  /* Altura em vh */
  width: 1.5vw;
  /* Largura em vw */

  border-radius: 50%;
  background: #ffffff;
  /* Cor da bolinha */
  cursor: pointer;
}

.volume-control input[type=range]::-moz-range-track {
  width: 100%;
  height: 0.74vh;
  background: #ff0199;
  /* Cor da linha do controle de volume */
  border-radius: 0.5rem;
}

.volume-control input[type=range]::-moz-range-thumb {
  border: 1px solid #1a0735;
  /* Contorno da bolinha */
  height: 15px;
  width: 15px;
  border-radius: 50%;
  background: #A1D0FF;
  /* Cor da bolinha */
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
  background: #ff0199;
  /* Cor da linha do controle de volume */
  border-radius: 5px;
}

.volume-control input[type=range]::-ms-fill-upper {
  background: #ff0199;
  /* Cor da linha do controle de volume */

  border-radius: 10%;

}

.volume-control input[type=range]::-ms-thumb {
  border: 1px solid #1a0735;
  /* Contorno da bolinha */
  height: 50px;
  width: 50px;
  border-radius: 50%;
  background: #A1D0FF;
  /* Cor da bolinha */
  cursor: pointer;
}



input[type=range] {
  height: 4px;
  z-index: 1;
  -webkit-appearance: none;
  margin: 0;
  width: 100%;
  background: linear-gradient(to right, #ce2323 0%, #ce2323 calc((100% * var(--value)) / var(--max)),
      #f0f9ff8e calc((100% * var(--value)) / var(--max)),
      #f0f9ff8e 100%);
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
  border: none;
  /*contorno da bolinha*/
  height: 18px;
  width: 19px;
  border-radius: 25px;
  background: #ffffff;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -7px;
}

input[type=range]:focus::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #ce2323 0%, #ce2323 calc((100% * var(--value)) / var(--max)),
      #f0f9ff8e calc((100% * var(--value)) / var(--max)),
      #f0f9ff8e 100%);
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
  height: 0.5vh;
  /* Ajuste conforme necessário */

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
}
</style>
