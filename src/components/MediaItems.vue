<template>
  <div>
    <button @click="selectedType = 'video'">Videos</button>
    <button @click="selectedType = 'image'">Imagens</button>
    <button @click="selectedType = 'audio'">Áudios</button>
    <ul>
      <li v-for="media in filteredMedia" :key="media.id">
        {{ media.name }} ({{ media.type }})
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      media: [
        { id: 1, name: 'Video 1', type: 'video' },
        { id: 2, name: 'Imagem 1', type: 'image' },
        { id: 3, name: 'Áudio 1', type: 'audio' },
        { id: 4, name: 'Video 2', type: 'video' },
        { id: 5, name: 'Imagem 2', type: 'image' },
        { id: 6, name: 'Áudio 2', type: 'audio' },
      ],
      selectedType: ''
    }
  },
  computed: {
    filteredMedia() {
      if (this.selectedType) {
        return this.media.filter(media => media.type === this.selectedType)
      } else {
        return this.media
      }
    }
  }
}
</script>