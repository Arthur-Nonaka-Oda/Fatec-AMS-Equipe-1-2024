<template>
    <div class="video-item">
      <video :src="video.url" controls></video>
      <div class="video-info">
        <span class="video-name">{{ video.name }}</span>
        <span class="video-duration">{{ video.duration }}</span>
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