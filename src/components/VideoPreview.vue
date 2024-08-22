<template>
  <div class="video">
    <video ref="videoPlayer" poster="/pirataria.jpg" controls>
      <source src="/vteste.mp4" type="video/mp4" />
      Seu navegador não suporta a exibição de vídeos.
    </video>
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
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      playPauseIcon: "/playIcone.png", // Caminho para o ícone de play
      totalDuration: "00:00:00",
      currentTime: "00:00:00",
    };
  },
  computed: {
    formattedTime() {
      return `${this.currentTime} / ${this.totalDuration}`;
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
    deleteVideo() {
      // Implementar lógica de exclusão
      console.log("Delete video logic here");
    },
    trimVideo() {
      // Implementar lógica de recorte
      console.log("Trim video logic here");
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
    video.addEventListener("timeupdate", () => {
      this.currentTime = this.formatTime(video.currentTime);
    });
    video.addEventListener("loadedmetadata", () => {
      this.totalDuration = this.formatTime(video.duration);
    });
  },
};
</script>

<style scoped>
.video {
  max-width: 600px;
  height: auto;
  aspect-ratio: 16 / 9;
  margin: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  position: absolute;
  right: 0;
}

.video video {
  width: 100%;
  height: 84%;
  object-fit: contain;
}

.controles {
  display: flex;
  align-items: center;
  background-color: #616161;
  height: 40px;
  padding: 5px;
  margin-top: 10px;
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
</style>
