<template>
  <div class="audio-item" @click="handleAddButtonClick" draggable="true" @dragstart="handleDragStart" @dragend="handleDragEnd">
    <audio :src="audio.url" controls class="audio-player"></audio>
    <div class="audio-info">
      <span class="audio-name">{{ truncatedName }}</span>
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
      if (name.length > maxLength) {
        return name.substring(0, maxLength) + '...';
      }
      return name;
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
  },
};
</script>

<style scoped>
.audio-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px); /* Ajusta para duas colunas com espaçamento */
  box-sizing: border-box; /* Inclui padding e border no cálculo da largura */
}

.audio-player {
  width: 100%;
  height: auto;
}

.audio-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 5px;
}

.audio-name {
  display: block;
  max-width: 13.89vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
