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
      <span v-if="useRealWaveform" class="waveform-indicator real" title="Waveform real do áudio">🎵</span>
      <span v-else-if="isLoadingRealWaveform" class="waveform-indicator loading" title="Carregando waveform...">⏳</span>
      <span v-else class="waveform-indicator mock" title="Waveform simulado">📊</span>
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
      uniqueId: 'waveform_' + Math.random().toString(36).substr(2, 9),
      realWaveformData: null,
      isLoadingRealWaveform: false,
      useRealWaveform: false
    };
  },
  
  mounted() {
    this.tryLoadRealWaveform();
  },
  
  watch: {
    audioItem: {
      handler() {
        this.tryLoadRealWaveform();
      },
      deep: true
    }
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
      
      // Se temos dados reais do waveform, usar eles
      if (this.useRealWaveform && this.realWaveformData) {
        return this.generateBarsFromRealData();
      }
      
      // Fallback: gerar waveform mock
      return this.generateMockWaveformBars();
    }
  },
  methods: {
    async tryLoadRealWaveform() {
      // Evitar múltiplas tentativas simultâneas
      if (this.isLoadingRealWaveform || !this.audioItem) {
        return;
      }
      
      this.isLoadingRealWaveform = true;
      this.useRealWaveform = false;
      
      try {
        console.log('🎵 Tentando carregar waveform real para:', this.audioItem.name);
        
        let audioUrl = null;
        
        // Tentar diferentes fontes de áudio
        if (this.audioItem.blob) {
          audioUrl = URL.createObjectURL(this.audioItem.blob);
        } else if (this.audioItem.url) {
          audioUrl = this.audioItem.url;
        } else if (this.audioItem.filePath) {
          // Em Electron, tentar acessar o arquivo local
          audioUrl = `file://${this.audioItem.filePath}`;
        }
        
        if (!audioUrl) {
          throw new Error('Nenhuma fonte de áudio disponível');
        }
        
        // Carregar e decodificar áudio
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Usar Web Audio API para decodificar
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extrair dados do canal (usar primeiro canal)
        const channelData = audioBuffer.getChannelData(0);
        this.realWaveformData = channelData;
        this.useRealWaveform = true;
        
        console.log('✅ Waveform real carregado com sucesso!', {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          samples: channelData.length
        });
        
        // Limpar URL temporária se foi criada do blob
        if (this.audioItem.blob && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        
        // Fechar o AudioContext para liberar recursos
        audioContext.close();
        
      } catch (error) {
        console.warn('⚠️ Erro ao carregar waveform real, usando mock:', error.message);
        this.useRealWaveform = false;
        this.realWaveformData = null;
      } finally {
        this.isLoadingRealWaveform = false;
      }
    },
    
    generateBarsFromRealData() {
      if (!this.realWaveformData) return [];
      
      const numberOfBars = Math.min(200, Math.max(40, this.width / 2));
      const barWidth = 200 / numberOfBars;
      const bars = [];
      
      // Calcular quantas amostras por barra
      const samplesPerBar = Math.floor(this.realWaveformData.length / numberOfBars);
      
      for (let i = 0; i < numberOfBars; i++) {
        // Calcular RMS (Root Mean Square) para cada segmento
        let sum = 0;
        const startSample = i * samplesPerBar;
        const endSample = Math.min(startSample + samplesPerBar, this.realWaveformData.length);
        
        for (let j = startSample; j < endSample; j++) {
          sum += this.realWaveformData[j] * this.realWaveformData[j];
        }
        
        const rms = Math.sqrt(sum / (endSample - startSample));
        const amplitude = Math.min(1, rms * 8); // Amplificar um pouco para visualização
        
        const barHeight = Math.max(2, amplitude * 50); // Mínimo 2px, máximo 50px
        const x = i * barWidth;
        const y = 30 - (barHeight / 2);
        
        bars.push({
          x: x,
          y: y,
          width: Math.max(1, barWidth - 0.5),
          height: barHeight,
          amplitude: amplitude
        });
      }
      
      return bars;
    },
    
    generateMockWaveformBars() {
      const duration = this.audioItem?.duration || 30;
      const numberOfBars = Math.min(200, Math.max(20, this.width / 3));
      const barWidth = 200 / numberOfBars;
      const bars = [];
      
      // Usar o nome do arquivo como seed para gerar um padrão consistente
      const seedString = `${this.audioItem.name}_${duration}_${this.audioItem.size || 0}`;
      const seed = this.hashCode(seedString);
      
      for (let i = 0; i < numberOfBars; i++) {
        const t = i / numberOfBars;
        const seededRandom = this.seededRandom(seed + i);
        
        // Criar diferentes padrões baseados na posição
        let amplitude = Math.sin(t * Math.PI * 2) * 0.4 + 
                       Math.sin(t * Math.PI * 6) * 0.3 + 
                       Math.sin(t * Math.PI * 12) * 0.2;
        
        amplitude += (seededRandom - 0.5) * 0.3;
        amplitude = Math.abs(amplitude);
        amplitude = Math.max(0.1, Math.min(1, amplitude));
        
        const barHeight = amplitude * 50;
        const x = i * barWidth;
        const y = 30 - (barHeight / 2);
        
        bars.push({
          x: x,
          y: y,
          width: Math.max(1, barWidth - 0.5),
          height: barHeight,
          amplitude: amplitude
        });
      }
      
      return bars;
    },
    
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
  },
  
  beforeDestroy() {
    // Limpar dados do waveform real para liberar memória
    this.realWaveformData = null;
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
  flex: 1;
}

.audio-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.waveform-indicator {
  font-size: 8px;
  opacity: 0.7;
  flex-shrink: 0;
}

.waveform-indicator.real {
  color: #4CAF50;
}

.waveform-indicator.loading {
  animation: pulse 1.5s infinite;
}

.waveform-indicator.mock {
  color: #FF9800;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Efeito hover */
.audio-waveform:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.audio-waveform:hover .audio-info {
  background: rgba(255, 255, 255, 1);
}
</style>