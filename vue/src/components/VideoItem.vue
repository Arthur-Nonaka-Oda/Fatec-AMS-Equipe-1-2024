<template>
  <div class="video-item" @click="handleAddButtonClick" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <img :src="video.url" class="video-player">
    <div class="video-info">
      <span class="video-name">{{ truncatedName }}</span>
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
  methods: {
    handleAddButtonClick() {
      this.$emit('add-video', this.video);
    },
    handleDragStart(event) {
      event.dataTransfer.setData('video', JSON.stringify(this.video));
      this.$emit('drag-start', this.video);
    },
    handleDragEnd() {
      this.$emit('drag-end', this.video);
    }
  },
  computed: {
    truncatedName() {
      const maxLength = 15;
      const name = this.video.name;
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...';
      }
      return name;
    }
  }
};
</script>

<style scoped>
.video-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px);
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: none;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.video-item:hover {
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.15);
}

.video-player {
  width: 100%;
  height: auto;
  display: block;
  background: #000;
}

.video-info { 
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 8px 12px;
  background: #F5F7FA;
}

.video-name {
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 400;
  color: #2d3748;
}
</style>
