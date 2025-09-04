<template>
  <div v-if="showModal" class="recording-source-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>Selecionar Fonte de Gravação</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="source-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'display' }]"
            @click="activeTab = 'display'"
          >
            🖥️ Capturar Tela
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'cameras' }]"
            @click="activeTab = 'cameras'"
          >
            📹 Câmeras
          </button>
        </div>

        <div class="source-content">
          <!-- Capturar Tela -->
          <div v-if="activeTab === 'display'" class="display-option">
            <div class="display-info">
              <div class="display-icon">🖥️</div>
              <div>
                <h4>Capturar Tela ou Janela</h4>
                <p>O sistema mostrará uma janela para você escolher qual tela, janela ou guia do navegador gravar.</p>
                <ul style="text-align: left; margin-top: 10px;">
                  <li>🖥️ <strong>Tela inteira</strong> - Grava todo o monitor</li>
                  <li>🪟 <strong>Janela específica</strong> - Grava apenas uma aplicação</li>
                  <li>🌐 <strong>Guia do navegador</strong> - Grava uma aba específica</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Câmeras -->
          <div v-if="activeTab === 'cameras'" class="sources-list">
            <div 
              v-for="camera in sources.cameras" 
              :key="camera.deviceId"
              :class="['source-item-list', { selected: selectedSource?.deviceId === camera.deviceId }]"
              @click="selectSource(camera, 'camera')"
            >
              <div class="camera-icon">📹</div>
              <div class="source-info">
                <div class="source-name">{{ camera.label || 'Câmera ' + (sources.cameras.indexOf(camera) + 1) }}</div>
                <div class="source-type">Câmera</div>
              </div>
            </div>
            
            <div class="microphone-selection" v-if="selectedSource && activeTab === 'cameras'">
              <h4>Selecionar Microfone (Opcional)</h4>
              <select v-model="selectedMicrophone" class="microphone-select">
                <option value="">Sem áudio</option>
                <option v-for="mic in sources.microphones" :key="mic.deviceId" :value="mic.deviceId">
                  {{ mic.label || 'Microfone ' + (sources.microphones.indexOf(mic) + 1) }}
                </option>
              </select>
            </div>
            
            <div v-if="sources.cameras.length === 0" class="no-sources">
              <p>� Nenhuma câmera encontrada</p>
              <p><small>Verifique se há câmeras conectadas e se as permissões estão habilitadas.</small></p>
            </div>
          </div>
        </div>

        <div class="audio-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="includeAudio" />
            Incluir áudio do sistema
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Cancelar</button>
        <button 
          class="btn btn-primary" 
          @click="startRecording"
          :disabled="!canStartRecording"
        >
          Iniciar Gravação
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecordingSourceSelector',
  props: {
    showModal: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'display', // Começar sempre com captura de tela
      sources: {
        screens: [],
        windows: [],
        cameras: [],
        microphones: [],
        speakers: []
      },
      selectedSource: null,
      selectedMicrophone: '',
      includeAudio: true,
      loading: false
    }
  },
  computed: {
    canStartRecording() {
      return this.activeTab === 'display' || this.selectedSource !== null;
    }
  },
  watch: {
    showModal(newValue) {
      if (newValue) {
        this.loadSources();
      }
    },
    activeTab() {
      this.selectedSource = null;
      this.selectedMicrophone = '';
    }
  },
  methods: {
    async loadSources() {
      try {
        this.loading = true;
        console.log("Carregando fontes de gravação...");
        
        const recorder = window.electron.recorder();
        
        // Verificar APIs antes de tentar obter fontes
        try {
          recorder.checkAPIAvailability();
        } catch (apiError) {
          throw new Error("APIs de mídia não disponíveis: " + apiError.message);
        }
        
        this.sources = await recorder.getAvailableSources();
        
        console.log("Fontes carregadas:", this.sources);
        
        // Verificar se há fontes disponíveis
        const totalSources = this.sources.screens.length + 
                           this.sources.windows.length + 
                           this.sources.cameras.length;
        
        if (totalSources === 0) {
          throw new Error("Nenhuma fonte de gravação encontrada");
        }
        
      } catch (error) {
        console.error("Erro ao carregar fontes:", error);
        let errorMessage = 'Erro ao carregar fontes de gravação: ';
        
        if (error.message.includes('APIs de mídia não disponíveis')) {
          errorMessage += 'APIs de mídia não estão disponíveis neste navegador/contexto.';
        } else if (error.message.includes('Nenhuma fonte')) {
          errorMessage += 'Nenhuma fonte de gravação foi encontrada.';
        } else {
          errorMessage += error.message;
        }
        
        this.$emit('error', errorMessage);
      } finally {
        this.loading = false;
      }
    },
    
    selectSource(source, type) {
      this.selectedSource = { ...source, type };
      console.log("Fonte selecionada:", this.selectedSource);
    },
    
    async startRecording() {
      try {
        console.log("Iniciando gravação com configuração:", {
          source: this.selectedSource,
          type: this.activeTab,
          includeAudio: this.includeAudio,
          microphoneId: this.selectedMicrophone
        });

        const recorder = window.electron.recorder();
        
        // Mapear activeTab para tipo correto
        let sourceType = this.activeTab;
        if (sourceType === 'screens') sourceType = 'screen';
        if (sourceType === 'windows') sourceType = 'window';
        if (sourceType === 'cameras') sourceType = 'camera';
        // display permanece como display
        
        const sourceConfig = {
          type: sourceType,
          source: this.selectedSource,
          includeAudio: this.includeAudio,
          microphoneId: this.selectedMicrophone
        };

        console.log("Configuração mapeada:", sourceConfig);

        await recorder.startRecordingWithSource(sourceConfig);
        
        this.$emit('recording-started', sourceConfig);
        this.closeModal();
      } catch (error) {
        console.error("Erro ao iniciar gravação:", error);
        let errorMessage = 'Erro ao iniciar gravação: ';
        
        if (error.message.includes('Stream não foi criado')) {
          errorMessage += 'Não foi possível acessar a fonte selecionada. Verifique as permissões.';
        } else if (error.message.includes('Usuário cancelou')) {
          errorMessage += 'Seleção de tela cancelada pelo usuário.';
        } else if (error.message.includes('API de mídia não está disponível')) {
          errorMessage += 'Funcionalidade de gravação não está disponível neste navegador.';
        } else if (error.message.includes('Nenhuma track de vídeo')) {
          errorMessage += 'Não foi possível obter vídeo da fonte selecionada.';
        } else {
          errorMessage += error.message;
        }
        
        this.$emit('error', errorMessage);
      }
    },
    
    closeModal() {
      this.$emit('close');
      this.selectedSource = null;
      this.selectedMicrophone = '';
      this.activeTab = 'screens';
    }
  }
}
</script>

<style scoped>
.recording-source-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

.source-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  padding: 10px 15px;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
}

.tab-btn:hover {
  background: #f8f9fa;
}

.sources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.source-item {
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.source-item:hover {
  border-color: #007bff;
}

.source-item.selected {
  border-color: #007bff;
  background: #f0f8ff;
}

.source-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.source-info {
  position: relative;
}

.source-name {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 14px;
}

.source-type {
  color: #666;
  font-size: 12px;
}

.app-icon {
  position: absolute;
  top: -30px;
  right: 5px;
  width: 20px;
  height: 20px;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-item-list {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.source-item-list:hover {
  border-color: #007bff;
}

.source-item-list.selected {
  border-color: #007bff;
  background: #f0f8ff;
}

.camera-icon {
  font-size: 24px;
  margin-right: 15px;
}

.microphone-selection {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.microphone-selection h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.microphone-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.display-option {
  text-align: center;
  padding: 40px 20px;
}

.display-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.display-icon {
  font-size: 48px;
}

.display-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.display-info p {
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.display-info ul {
  color: #555;
  margin: 10px 0;
}

.display-info li {
  margin: 5px 0;
}

.no-sources {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-sources p {
  margin: 10px 0;
}

.audio-options {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
}
</style>
