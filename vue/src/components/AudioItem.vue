<template>
  <div class="audio-container"> <!-- Contêiner pai -->
    <div
      class="audio-item"
      @click="handleAddButtonClick"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      role="button"
      tabindex="0"
      aria-label="Item de áudio"
    >
      <audio :src="audio.url" controls class="audio-player"></audio>
      <div class="audio-info">
        <span class="audio-name">{{ truncatedName }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioItem',
  props: {
    audio: {
      type: Object,
      required: true
    }
  },
  computed: {
    truncatedName() {
      const maxLength = 15;
      const name = this.audio.name;
      return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
    }
  },
  methods: {
    handleAddButtonClick() {
      this.$emit('add-audio', this.audio);
    },
    handleDragStart(event) {
      event.dataTransfer.setData('audio', JSON.stringify(this.audio));
      this.$emit('drag-start', this.audio);
    },
    handleDragEnd() {
      this.$emit('drag-end', this.audio);
    }
  }
};
</script>

<style scoped>
.audio-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 100%;
}

.audio-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px);
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: none;
  transition: all 0.2s ease;
  align-self: flex-start;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.audio-item:hover {
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.15);
}

.audio-player {
  width: 100%;
  height: 40px;
  border-radius: 6px;
}

.audio-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 8px;
}

.audio-name {
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  font-size: 13px;
  color: #2d3748;
}

@media (max-width: 768px) {
  .audio-item {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
