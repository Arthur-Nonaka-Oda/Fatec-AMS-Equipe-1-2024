<template>
    <div class="video-item" @click="handleAddButtonClick">
      <video :src="video.url"></video>
      <div class="video-info">
        <span class="video-name">{{ video.name }}</span>
        <span class="video-duration">{{ formatedDuration }}</span>
        <span class="video-size">{{ video.size }} MB</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      video: {
        type: Object,
        required: true
      }
    },
    computed: {
    formatedDuration() {
      return this.formatDuration(this.video.duration);
    }
  },
    methods: {
        formatDuration(durationInSeconds) {
            const hours = Math.floor(durationInSeconds / 3600);
            const minutes = Math.floor((durationInSeconds % 3600) / 60);
            const seconds = Math.floor(durationInSeconds % 60);
            console.log("batata");
            console.log(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },
        handleAddButtonClick() {
          // this.$timeline.addVideo(this.video);
          this.$emit('add-video', this.video);
        }
    }
  };
  </script>
  
  <style scoped>
  .video-item {
    margin-bottom: 20px;
  }
  .video-item:hover {
    cursor: pointer;
  }
  .video-info {
    display: flex;
    justify-content: space-between;
  }
  </style>