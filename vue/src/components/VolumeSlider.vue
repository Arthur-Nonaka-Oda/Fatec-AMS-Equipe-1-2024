<template>
  <div class="volume-slider">
    <input
      type="range"
      min="0"
      max="100"
      :value="displayVolume"
      @input="onInput"
    />
  </div>
</template>

<script>
export default {
  props: {
    // se o componente usa `value` ou `volume`, adapte o nome
    value: {
      type: Number,
      default: 100
    }
  },
  computed: {
    displayVolume() {
      // preserva 0; só usa 100 quando value for null/undefined
      return this.value == null ? 100 : this.value;
      // ou, se seu ambiente suporta: return this.value ?? 100;
    }
  },
  methods: {
    onInput(e) {
      const v = Number(e.target.value);
      // emite para o pai; preserve 0
      this.$emit('input', v);
      this.$emit('change', v);
    }
  }
};
</script>

<style scoped>
.volume-slider {
    display: flex;
    align-items: center;
    background-color: aliceblue;
    width: 100%;
    /* height: 5px; */
    padding: 5px;
}
</style>