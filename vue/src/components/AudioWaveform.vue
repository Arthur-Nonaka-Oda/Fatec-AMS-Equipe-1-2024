<template>
  <div class="audio-waveform" ref="waveformContainer">
    <svg 
      :width="width" 
      :height="height" 
      class="waveform-svg"
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
    >
      <!-- Fundo com gradiente -->
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4a90e2;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#4a90e2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2c5aa0;stop-opacity:0.8" />
        </linearGradient>
      </defs>
      
      <!-- Linha central -->
      <line x1="0" y1="30" x2="200" y2="30" stroke="#e0e0e0" stroke-width="0.5" opacity="0.7"/>
      
      <!-- Barras do waveform -->
      <g v-for="(bar, index) in waveformBars" :key="`${waveformKey}_bar_${index}`">
        <rect 
          :x="bar.x" 
          :y="bar.y" 
          :width="bar.width" 
          :height="bar.height"
          :fill="`url(#${gradientId})`"
          :opacity="0.8 + (bar.amplitude * 0.2)"
        />
      </g>
    </svg>
    
    <div class="audio-info">
      <span class="audio-name">{{ audioName }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioWaveform',
  props: {
    audioItem: {
      type: Object,
      required: true
    },
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 60
    }
  },
  data() {
    return {
      uniqueId: 'waveform_' + Math.random().toString(36).substr(2, 9)
    };
  },
  computed: {
    audioName() {
      if (this.audioItem && this.audioItem.name) {
        const maxLength = 15;
        const name = this.audioItem.name;
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
      }
      return 'Audio';
    },
    
    gradientId() {
      return `waveGradient_${this.uniqueId}`;
    },
    
    waveformKey() {
      // Criar uma key única baseada no item de áudio e propriedades
      return `${this.audioItem?.name || 'unknown'}_${this.audioItem?.duration || 0}_${this.width}_${this.uniqueId}`;
    },
    
    waveformBars() {
      // Garantir que há um audioItem válido
      if (!this.audioItem || !this.audioItem.name) {
        return [];
      }
      
      // Gerar barras do waveform baseado na duração e nome do arquivo
      const duration = this.audioItem?.duration || 30;
      const numberOfBars = Math.min(80, Math.max(20, this.width / 3)); // Entre 20 e 80 barras
      const barWidth = 200 / numberOfBars;
      const bars = [];
      
      // Usar o nome do arquivo como seed para gerar um padrão consistente
      // Adicionar duração para tornar ainda mais único
      const seedString = `${this.audioItem.name}_${duration}_${this.audioItem.size || 0}`;
      const seed = this.hashCode(seedString);
      
      for (let i = 0; i < numberOfBars; i++) {
        // Usar seed para gerar números pseudo-aleatórios consistentes
        const t = i / numberOfBars;
        const seededRandom = this.seededRandom(seed + i);
        
        // Criar diferentes padrões baseados na posição
        let amplitude = Math.sin(t * Math.PI * 2) * 0.4 + 
                       Math.sin(t * Math.PI * 6) * 0.3 + 
                       Math.sin(t * Math.PI * 12) * 0.2;
        
        // Adicionar variação baseada no seed
        amplitude += (seededRandom - 0.5) * 0.3;
        amplitude = Math.abs(amplitude);
        amplitude = Math.max(0.1, Math.min(1, amplitude)); // Limitar entre 0.1 e 1
        
        const barHeight = amplitude * 50; // Máximo 50px de altura
        const x = i * barWidth;
        const y = 30 - (barHeight / 2); // Centralizar verticalmente
        
        bars.push({
          x: x,
          y: y,
          width: Math.max(1, barWidth - 0.5),
          height: barHeight,
          amplitude: amplitude
        });
      }
      
      return bars;
    }
  },
  methods: {
    // Gerar hash code a partir de uma string para usar como seed
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para 32bit integer
      }
      return Math.abs(hash);
    },
    
    // Gerador de números pseudo-aleatórios com seed
    seededRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }
  }
};
</script>

<style scoped>
.audio-waveform {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.waveform-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.audio-info {
  position: absolute;
  bottom: 2px;
  left: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  padding: 1px 4px;
}

.audio-name {
  font-size: 10px;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Efeito hover */
.audio-waveform:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.audio-waveform:hover .audio-info {
  background: rgba(255, 255, 255, 1);
}
</style>