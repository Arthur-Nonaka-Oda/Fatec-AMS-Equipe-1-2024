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
    background: #F5F7FA;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
}

.volume-slider input[type="range"] {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #0066FF;
    border-radius: 4px;
    outline: none;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #0066FF;
    cursor: pointer;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
}

.volume-slider input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #0066FF;
    cursor: pointer;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.1);
}
</style>