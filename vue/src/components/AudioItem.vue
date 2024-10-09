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
  flex-wrap: wrap; /* Permite que os itens se movam para a próxima linha se não houver espaço */
  justify-content: flex-start; /* Alinha os itens à esquerda */
}

.audio-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10px); /* Ajusta para duas colunas com espaçamento */
  box-sizing: border-box; /* Inclui padding e border no cálculo da largura */
  padding: 10px; /* Adiciona espaçamento interno */
  margin-bottom: 20px; /* Espaçamento entre os itens */
  background-color: #e0e0e0; /* Cor de fundo mais clara para destaque */
  border-radius: 8px; /* Canto arredondado */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra suave para efeito de profundidade */
  transition: transform 0.3s ease, background-color 0.3s ease; /* Animação ao passar o mouse */
  align-self: flex-start; /* Alinha o item à esquerda */
}

.audio-item:hover {
  transform: translateY(-5px); /* Elevação suave ao passar o mouse */
  background-color: #d0d0d0; /* Mudança de cor ao passar o mouse */
}

.audio-player {
  width: 100%;
  height: auto;
  border-radius: 4px; /* Canto arredondado no player */
}

.audio-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 5px; /* Aumenta o espaçamento acima das informações */
}

.audio-name {
  display: block;
  max-width: 13.89vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold; /* Deixa o nome mais destacado */
  color: #333; /* Cor mais escura para melhor legibilidade */
}

@media (max-width: 768px) {
  .audio-item {
    width: 100%; /* Ocupa toda a largura em telas menores */
    margin-bottom: 10px; /* Reduz o espaçamento entre os itens */
  }
}
</style>
