<template>
  <div class="video">
    <div class="video-container">
      <video ref="videoPlayer" @timeupdate="updateTime" @loadedmetadata="updateDuration">
        <source :src="currentVideo" type="video/mp4" />
        Seu navegador não suporta a exibição de vídeos.
      </video>
      <audio ref="audioPlayer" v-if="currentAudio">
        <source :src="currentAudio" type="audio/mp3" />
        Seu navegador não suporta a reprodução de áudio.
      </audio>
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
      currentAudioIndex: 0,
      currentVideo: null,
      currentAudio: null,
      playPauseIcon: "../playIcon2.png", // Caminho para o ícone de play
      videoDuration: 0,
      currentTime: 0,
      currentGlobalTime: 0,
      volume: 1,
      showVolumeControl: false,
      volumeIcon: "/volume.png",
      audioSyncMap: null

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
        console.log('Timeline changed, reloading video and audio...');
        console.log('Videos in layer 0:', this.timeline.listFilesInLayer(0));
        console.log('Audios in layer 1:', this.timeline.listFilesInLayer(1));
        this.loadVideo();
        this.loadAudio();
      }
    }
  },
  methods: {
    async loadVideo() {
      const videos = this.timeline.listFilesInLayer(0);
      if (videos.length > 0) {
        const currentItem = videos[this.currentIndex];
        console.log('Carregando vídeo:', currentItem);
        
        // Verificar se currentItem é válido
        if (!currentItem) {
          console.error('Item de vídeo inválido');
          this.currentVideo = null;
          return;
        }
        
        // Se o blob não existir, tentar carregar do filePath
        if (!currentItem.blob && currentItem.filePath) {
          console.log('Blob não encontrado, carregando do filePath:', currentItem.filePath);
          try {
            // Usar fetch para carregar o arquivo do filePath
            const response = await fetch(`file://${currentItem.filePath}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            if (blob && blob.size > 0) {
              currentItem.blob = blob;
              console.log('Blob carregado via fetch:', blob);
            } else {
              throw new Error('Blob vazio ou inválido');
            }
          } catch (error) {
            console.error('Erro ao carregar vídeo do filePath:', error);
            // Se falhar, tentar via Electron
            try {
              if (window.electron && window.electron.ipcRenderer) {
                console.log('Tentando carregar via Electron...');
                const base64Data = await window.electron.ipcRenderer.invoke('load-video-file', { filePath: currentItem.filePath });
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'video/mp4' });
                if (blob && blob.size > 0) {
                  currentItem.blob = blob;
                  console.log('Blob carregado via Electron:', blob);
                } else {
                  throw new Error('Blob criado via Electron é inválido');
                }
              } else {
                throw new Error('Electron não disponível');
              }
            } catch (electronError) {
              console.error('Erro ao carregar vídeo via Electron:', electronError);
              this.currentVideo = null;
              return;
            }
          }
        }
        
        // Verificar se o blob é válido antes de criar o ObjectURL
        if (currentItem.blob && currentItem.blob instanceof Blob && currentItem.blob.size > 0) {
          try {
            this.currentVideo = URL.createObjectURL(currentItem.blob);
            console.log('ObjectURL criado com sucesso:', this.currentVideo);

            const video = this.$refs.videoPlayer;
            if (video) {
              this.$nextTick(() => {
                video.currentTime = currentItem.startTime || 0;
                video.volume = (currentItem.volume ?? 1) * this.volume;
                this.updatePlayPauseIcon();
              });
              video.load();
            }
          } catch (urlError) {
            console.error('Erro ao criar ObjectURL:', urlError);
            this.currentVideo = null;
          }
        } else {
          console.warn('Blob inválido ou não encontrado:', currentItem.blob);
          this.currentVideo = null;
        }
      } else {
        console.log('Nenhum vídeo encontrado na camada 0');
        this.currentVideo = null;
        const video = this.$refs.videoPlayer;
        if (video) {
          video.load();
          this.updatePlayPauseIcon();
        }
      }
    },
    async loadAudio() {
      const audios = this.timeline.listFilesInLayer(1);
      if (audios.length > 0) {
        const currentAudioItem = audios[this.currentAudioIndex];
        console.log('Carregando áudio:', currentAudioItem);
        
        // Verificar se currentAudioItem é válido
        if (!currentAudioItem) {
          console.error('Item de áudio inválido');
          this.currentAudio = null;
          return;
        }
        
        // Se o blob não existir, tentar carregar do filePath
        if (!currentAudioItem.blob && currentAudioItem.filePath) {
          console.log('Blob de áudio não encontrado, carregando do filePath:', currentAudioItem.filePath);
          try {
            // Usar fetch para carregar o arquivo do filePath
            const response = await fetch(`file://${currentAudioItem.filePath}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            if (blob && blob.size > 0) {
              currentAudioItem.blob = blob;
              console.log('Blob de áudio carregado via fetch:', blob);
            } else {
              throw new Error('Blob de áudio vazio ou inválido');
            }
          } catch (error) {
            console.error('Erro ao carregar áudio do filePath:', error);
            // Se falhar, tentar via Electron
            try {
              if (window.electron && window.electron.ipcRenderer) {
                console.log('Tentando carregar áudio via Electron...');
                const base64Data = await window.electron.ipcRenderer.invoke('load-video-file', { filePath: currentAudioItem.filePath });
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const audioType = currentAudioItem.filePath.toLowerCase().includes('.mp3') ? 'audio/mp3' : 'audio/wav';
                const blob = new Blob([byteArray], { type: audioType });
                if (blob && blob.size > 0) {
                  currentAudioItem.blob = blob;
                  console.log('Blob de áudio carregado via Electron:', blob);
                } else {
                  throw new Error('Blob de áudio criado via Electron é inválido');
                }
              } else {
                throw new Error('Electron não disponível');
              }
            } catch (electronError) {
              console.error('Erro ao carregar áudio via Electron:', electronError);
              this.currentAudio = null;
              return;
            }
          }
        }
        
        // Verificar se o blob é válido antes de criar o ObjectURL
        if (currentAudioItem.blob && currentAudioItem.blob instanceof Blob && currentAudioItem.blob.size > 0) {
          try {
            this.currentAudio = URL.createObjectURL(currentAudioItem.blob);
            console.log('ObjectURL de áudio criado com sucesso:', this.currentAudio);

            const audio = this.$refs.audioPlayer;
            if (audio) {
              this.$nextTick(() => {
                audio.currentTime = currentAudioItem.startTime || 0;
                // Aplica o volume combinado para o áudio
                audio.volume = (currentAudioItem.volume ?? 1) * this.volume;
                this.updatePlayPauseIcon();
              });
              audio.load();
            }
          } catch (urlError) {
            console.error('Erro ao criar ObjectURL de áudio:', urlError);
            this.currentAudio = null;
          }
        } else {
          console.warn('Blob de áudio inválido ou não encontrado:', currentAudioItem.blob);
          this.currentAudio = null;
        }
      } else {
        console.log('Nenhum áudio encontrado na camada 1');
        this.currentAudio = null;
        const audio = this.$refs.audioPlayer;
        if (audio) {
          audio.load();
        }
        this.updatePlayPauseIcon();
      }
    },
    initializeAudioSync() {
      const videos = this.timeline.listFilesInLayer(0);
      const audios = this.timeline.listFilesInLayer(1);

      this.audioSyncMap = audios.map((audioItem, index) => {
        let globalStartTime = 0;
        for (let i = 0; i < index; i++) {
          globalStartTime += videos[i].duration;
        }

        return {
          audioItem,
          globalStartTime,
          globalEndTime: globalStartTime + audioItem.duration
        };
      });
    },
    handleVideoEnded() {
      const videos = this.timeline.listFilesInLayer(0);
      if (this.currentIndex < videos.length - 1) {
        this.currentIndex++;
        this.loadVideo();
        const playPromise = this.$refs.videoPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Erro ao reproduzir próximo vídeo:', error);
            this.$refs.videoPlayer.pause();
          });
        }
      } else {
        this.currentIndex = 0;
        const video = this.$refs.videoPlayer;
        this.loadVideo();
        this.$nextTick(() => {
          video.currentTime = videos[this.currentIndex].startTime;
          console.log(videos[this.currentIndex].startTime);
          video.pause();
          if (this.$refs.audioPlayer) {
            this.$refs.audioPlayer.pause();
          }
          this.updatePlayPauseIcon();
        });

      }
    },
    handleAudioEnded() {
      const audios = this.timeline.listFilesInLayer(1);
      if (this.currentAudioIndex < audios.length - 1) {
        this.currentAudioIndex++;
        this.loadAudio();
        const playPromise = this.$refs.audioPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Erro ao reproduzir próximo áudio:', error);
            this.$refs.audioPlayer.pause();
          });
        }
      } else {
        this.currentAudioIndex = 0;
        const audio = this.$refs.audioPlayer;
        audio.currentTime = audios[this.currentAudioIndex].startTime;
        this.loadAudio();
        audio.pause();
      }
    },
    togglePlayPause() {
      const video = this.$refs.videoPlayer;
      const audio = this.$refs.audioPlayer;

      if (!video) {
        console.warn('Elemento de vídeo não encontrado');
        return;
      }

      if (video.paused) {
        const videoPromise = video.play();
        if (videoPromise !== undefined) {
          videoPromise
            .then(() => {
              if (audio && this.currentAudio) {
                return audio.play();
              }
            })
            .then(() => {
              console.log('Video e áudio reproduzindo com sucesso');
            })
            .catch(error => {
              console.error('Erro na reprodução:', error);
              // Em caso de erro, garante que tanto vídeo quanto áudio estejam pausados
              video.pause();
              if (audio) audio.pause();
            });
        }
        this.playPauseIcon = "/pausaicon2.png";
      } else {
        video.pause();
        if (audio && this.currentAudio) {
          audio.pause();
        }
        this.playPauseIcon = "/playIcon2.png";
      }
    },
    updatePlayPauseIcon() {
      const video = this.$refs.videoPlayer;
      if (video) {
        this.playPauseIcon = video.paused ? "/playIcon2.png" : "/pausaicon2.png";
      } else {
        this.playPauseIcon = "/playIcon2.png";
      }
    },
    async updateVolume() {
      const video = this.$refs.videoPlayer;
      const audio = this.$refs.audioPlayer;
      
      const updateMediaVolume = async (mediaElement, item) => {
        if (!mediaElement) return;
        
        try {
          // Calcula o volume efetivo
          const itemVolume = typeof item?.volume === 'number' ? item.volume : 1;
          const masterVolume = typeof this.volume === 'number' ? this.volume : 1;
          const effectiveVolume = Math.max(0, Math.min(1, itemVolume * masterVolume));
          
          // Aplica o volume com uma pequena transição
          const currentVolume = mediaElement.volume;
          const steps = 5;
          const volumeDiff = (effectiveVolume - currentVolume) / steps;
          
          for (let i = 1; i <= steps; i++) {
            mediaElement.volume = currentVolume + (volumeDiff * i);
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          
          // Garante o valor final exato
          mediaElement.volume = effectiveVolume;
          console.log('Volume ajustado para:', effectiveVolume, 'em:', mediaElement);
          
          // Verifica se o volume foi realmente aplicado
          if (Math.abs(mediaElement.volume - effectiveVolume) > 0.01) {
            console.warn('Volume não foi aplicado corretamente!');
          }
        } catch (error) {
          console.error('Erro ao atualizar volume:', error);
        }
      };
      
      // Atualiza vídeo
      if (video) {
        const videos = this.timeline.listFilesInLayer(0);
        const currentItem = videos[this.currentIndex];
        await updateMediaVolume(video, currentItem);
      }
      
      // Atualiza áudio
      if (audio) {
        const audios = this.timeline.listFilesInLayer(1);
        const currentAudioItem = audios[this.currentAudioIndex];
        await updateMediaVolume(audio, currentAudioItem);
      }
      
      // Atualiza ícone baseado no volume efetivo mais alto
      const videoVolume = video?.volume || 0;
      const audioVolume = audio?.volume || 0;
      const maxVolume = Math.max(videoVolume, audioVolume);
      this.volumeIcon = maxVolume <= 0.01 ? "/mudo.png" : "/volume.png";
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
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.updatePlayPauseIcon();
          })
          .catch(error => {
            console.error('Erro ao reproduzir segmento:', error);
            video.pause();
          });
      }

      const pauseAtEndTime = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          video.removeEventListener('timeupdate', pauseAtEndTime);
        }
      };

      video.addEventListener('timeupdate', pauseAtEndTime);
    },
    updateCurrentTime(currentGlobalTime) {
      this.currentGlobalTime = currentGlobalTime;
      const video = this.$refs.videoPlayer;
      video.pause();
      this.seekVideo();
    },
    updateTime() {
      const video = this.$refs.videoPlayer;
      const audio = this.$refs.audioPlayer;
      const videos = this.timeline.listFilesInLayer(0);
      const audios = this.timeline.listFilesInLayer(1);
      let accumulated = 0;
      for (let i = 0; i < this.currentIndex; i++) {
        accumulated += videos[i].duration;
      }
      if (videos.length > 0) {
        this.currentGlobalTime = accumulated + (video.currentTime - videos[this.currentIndex].startTime);


        if (audio && this.currentAudio && this.audioSyncMap) {
          // Find the matching audio segment
          const matchingSegment = this.audioSyncMap.find(segment =>
            this.currentGlobalTime >= segment.globalStartTime &&
            this.currentGlobalTime < segment.globalEndTime
          );

          if (matchingSegment) {
            // Calculate relative time within the audio segment
            const relativeAudioTime = this.currentGlobalTime - matchingSegment.globalStartTime;

            // Only update if there's a significant difference
            if (Math.abs(audio.currentTime - relativeAudioTime) > 0.1) {
              audio.currentTime = relativeAudioTime;
            }
          }
        }

        const slider = this.$el.querySelector('.time-slider');
        slider.style.setProperty('--value', this.currentGlobalTime);
        slider.style.setProperty('--max', this.totalDuration);

        const currentVideo = videos[this.currentIndex];
        if (video.currentTime >= currentVideo.endTime) {
          this.handleVideoEnded();
        }

        const currentAudio = audios[this.currentAudioIndex];
        if (this.currentAudio) {
          if (audio.currentTime >= currentAudio.endTime) {
            this.handleAudioEnded();
          }
        }

        this.$emit('update-time', this.currentGlobalTime);
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

      // Se precisamos mudar o segmento de vídeo
      if (targetIndex !== this.currentIndex) {
        this.currentIndex = targetIndex;

        // Revoga a URL anterior se existir
        if (this.currentVideo) {
          URL.revokeObjectURL(this.currentVideo);
        }

        const currentVideo = videos[targetIndex];
        if (!currentVideo) {
          console.error('Vídeo não encontrado no índice:', targetIndex);
          return;
        }

        // Verifica se o blob existe e é válido
        if (!currentVideo.blob || !(currentVideo.blob instanceof Blob)) {
          console.error('Blob inválido ou não encontrado:', currentVideo);
          return;
        }

        try {
          // Cria uma nova URL para o blob inteiro
          this.currentVideo = URL.createObjectURL(currentVideo.blob);

          this.$nextTick(() => {
            const video = this.$refs.videoPlayer;
            if (video) {
              const relativeTime = globalTime - accumulated;
              video.currentTime = relativeTime;
              video.load();
              this.updatePlayPauseIcon();
            }
          });
        } catch (error) {
          console.error('Erro ao criar URL para o vídeo:', error);
          this.currentVideo = null;
        }
      }

      // Atualiza o tempo do vídeo atual
      const relativeTime = globalTime - accumulated;
      const video = this.$refs.videoPlayer;
      if (video) {
        video.currentTime = relativeTime;
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

    if (video) {
      this.initializeAudioSync();

      video.addEventListener("timeupdate", this.updateTime);
      video.addEventListener("loadedmetadata", this.updateDuration);
      video.addEventListener("play", this.updatePlayPauseIcon);
      video.addEventListener("pause", this.updatePlayPauseIcon);
      video.addEventListener("ended", this.handleVideoEnded);
    }
    
    this.loadVideo();
    // this.loadAudio();
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
  appearance: none;
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
  appearance: none;
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
  transition: all 0.2s ease;
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
  transition: all 0.2s ease;
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
  transition: all 0.2s ease;
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
