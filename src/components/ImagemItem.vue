<template>
    <div class="image-item">
      <img :src="image.url" alt="Imagem" class="image-display" />
      <div class="image-info">
        <span class="image-name">{{ truncatedName }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ImageItem',
    props: {
      image: {
        type: Object,
        required: true
      }
    },
    computed: {
      truncatedName() {
        const maxLength = 15;
        const name = this.image.name;
        if (name.length > maxLength) {
          return name.substring(0, maxLength) + '...';
        }
        return name;
      }
    }
  };
  </script>
  
  <style scoped>
  .image-item {
    display: grid;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 10px;
    width: 100%;
    height: 100%;
  }
  
  .image-display {
    width: 12vw;
    height: auto;
  }
  
  .image-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-top: 5px;
  }
  
  .image-name {
    display: block;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  </style>
  