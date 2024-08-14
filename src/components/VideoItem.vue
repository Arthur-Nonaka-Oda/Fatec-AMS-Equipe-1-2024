<template>
    <div class="video-item">
      <video :src="video.url" controls></video>
      <div class="video-info">
        <span class="video-name">{{ video.name }}</span>
        <span class="video-duration">{{ formatDuration }}</span>
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
    formattedDuration() {
      return this.formatDuration(this.video.duration);
    }
  },
    methods: {
        formatDuration(durationInSeconds) {
            const hours = Math.floor(durationInSeconds / 3600);
            const minutes = Math.floor((durationInSeconds % 3600) / 60);
            const seconds = Math.floor(durationInSeconds % 60);
    
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
  };
  </script>
  
  <style scoped>
  .video-item {
    margin-bottom: 20px;
  }
  .video-info {
    display: flex;
    justify-content: space-between;
  }
  </style>