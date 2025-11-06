/* eslint-disable */
<template>
  <div v-if="showModal" class="recording-source-modal">
    <div class="modal-overlay" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎬 Gravação com Picture-in-Picture</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="pip-info">
          <p>Configure sua gravação combinando tela/janela com câmera sobreposta em Picture-in-Picture</p>
        </div>

        <div class="source-content">
          <!-- Seleção de Tela/Display -->
          <div class="section">
            <h4>📺 Fonte Principal (Tela/Janela)</h4>
            <div class="display-sources">
              <div 
                v-for="source in displaySources" 
                :key="source.id"
                :class="['source-preview-item', { selected: selectedDisplay?.id === source.id }]"
                @click="selectDisplay(source)"
              >
                <div class="source-thumbnail-container">
                  <img 
                    :src="source.thumbnail" 
                    :alt="source.name"
                    class="source-thumbnail"
                  />
                  <div class="source-type-badge">
                    {{ source.type === 'screen' ? '🖥️ Tela' : '🪟 Janela' }}
                  </div>
                </div>
                <div class="source-info">
                  <div class="source-name">{{ source.name }}</div>
                  <div class="source-description">{{ getSourceDescription(source) }}</div>
                </div>
              </div>
              
              <div v-if="displaySources.length === 0 && !loading" class="no-sources">
                <p>🖥️ Nenhuma tela/janela encontrada</p>
                <p><small>Aguarde enquanto carregamos as fontes disponíveis...</small></p>
              </div>
              
              <div v-if="loading" class="loading-sources">
                <p>🔄 Carregando fontes de tela...</p>
              </div>
            </div>
          </div>

          <!-- Seleção de Câmera para PIP -->
          <div class="section">
            <h4>📹 Câmera para Picture-in-Picture (Opcional)</h4>
            <p class="section-description">Selecione uma câmera para sobrepor na gravação, ou deixe em branco para gravar apenas a tela.</p>
            <div class="sources-list">
              <div 
                v-for="camera in sources.cameras" 
                :key="camera.deviceId"
                :class="['source-item-list', { selected: selectedCamera?.deviceId === camera.deviceId }]"
                @click="selectCamera(camera)"
              >
                <div class="camera-icon">📹</div>
                <div class="source-info">
                  <div class="source-name">{{ camera.label || 'Câmera ' + (sources.cameras.indexOf(camera) + 1) }}</div>
                  <div class="source-type">Câmera para PIP</div>
                </div>
              </div>
              
              <!-- Opção para não usar câmera -->
              <div 
                :class="['source-item-list', 'no-camera-option', { selected: selectedCamera === null }]"
                @click="selectCamera(null)"
              >
                <div class="camera-icon">🚫</div>
                <div class="source-info">
                  <div class="source-name">Sem câmera</div>
                  <div class="source-type">Gravar apenas a tela</div>
                </div>
              </div>
              
              <div v-if="sources.cameras.length === 0" class="no-sources">
                <p>📹 Nenhuma câmera encontrada</p>
                <p><small>Você ainda pode gravar apenas a tela selecionando "Sem câmera" acima.</small></p>
              </div>
            </div>

            <!-- Controles de PIP -->
            <div v-if="selectedCamera" class="pip-controls">
              <h4>⚙️ Configurações do PIP</h4>
              <div class="pip-settings">
                <div class="setting-group">
                  <label>Posição:</label>
                  <select v-model="pipPosition">
                    <option value="top-right">Superior Direito</option>
                    <option value="top-left">Superior Esquerdo</option>
                    <option value="bottom-right">Inferior Direito</option>
                    <option value="bottom-left">Inferior Esquerdo</option>
                  </select>
                </div>
                <div class="setting-group">
                  <label>Tamanho:</label>
                  <select v-model="pipSize">
                    <option value="small">Pequeno (15%)</option>
                    <option value="medium">Médio (20%)</option>
                    <option value="large">Grande (25%)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Seleção de Microfone -->
            <div v-if="selectedCamera" class="microphone-selection">
              <h4>🎤 Microfone (Opcional)</h4>
              <select v-model="selectedMicrophone" class="microphone-select">
                <option value="">Sem áudio de microfone</option>
                <option v-for="mic in sources.microphones" :key="mic.deviceId" :value="mic.deviceId">
                  {{ mic.label || 'Microfone ' + (sources.microphones.indexOf(mic) + 1) }}
                </option>
              </select>
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
      sources: {
        screens: [],
        windows: [],
        cameras: [],
        microphones: [],
        speakers: []
      },
      selectedCamera: null,
      selectedDisplay: null,
      selectedMicrophone: '',
      pipPosition: 'bottom-right',
      pipSize: 'medium',
      includeAudio: true,
      loading: false,
      // Variáveis para controle de gravação
      mediaRecorder: null,
      recordingStream: null,
      chunks: []
    }
  },
  computed: {
    canStartRecording() {
      // Pode gravar se tiver display selecionado (câmera é opcional)
      return this.selectedDisplay !== null;
    },
    displaySources() {
      return [...this.sources.screens, ...this.sources.windows];
    }
  },
  watch: {
    showModal(newValue) {
      if (newValue) {
        this.loadSources();
      }
    }
  },
  methods: {
    async loadSources() {
      try {
        this.loading = true;
        console.log("🔍 Carregando fontes de gravação...");
        console.log("🔍 window.electron disponível:", !!window.electron);
        
        // Verificar se as APIs do Electron estão disponíveis
        if (!window.electron) {
          throw new Error("APIs do Electron não estão disponíveis. Certifique-se de que o preload.js foi carregado.");
        }
        
        // Usar APIs diretas do electron ao invés do Recorder
        console.log("📺 Obtendo desktop sources diretamente...");
        let desktopSources = [];
        try {
          desktopSources = await window.electron.getDesktopSources();
          console.log("✅ Desktop sources obtidas:", desktopSources.length);
        } catch (desktopError) {
          console.warn("⚠️ Erro ao obter desktop sources:", desktopError);
        }

        console.log("🎥 Obtendo media devices...");
        let mediaDevices = [];
        try {
          mediaDevices = await navigator.mediaDevices.enumerateDevices();
          console.log("✅ Media devices obtidos:", mediaDevices.length);
        } catch (mediaError) {
          console.warn("⚠️ Erro ao obter media devices:", mediaError);
        }

        // Organizar fontes
        this.sources = {
          screens: desktopSources.filter(source => source.type === 'screen'),
          windows: desktopSources.filter(source => source.type === 'window'),
          cameras: mediaDevices.filter(device => device.kind === 'videoinput'),
          microphones: mediaDevices.filter(device => device.kind === 'audioinput'),
          speakers: mediaDevices.filter(device => device.kind === 'audiooutput')
        };
        
        console.log("📋 Fontes organizadas:", this.sources);
        
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
        
        // Verificar se error.message existe e é string
        const errorMsg = error.message || error.toString() || 'Erro desconhecido';
        
        if (errorMsg.includes('APIs de mídia não disponíveis')) {
          errorMessage += 'APIs de mídia não estão disponíveis neste navegador/contexto.';
        } else if (errorMsg.includes('Nenhuma fonte')) {
          errorMessage += 'Nenhuma fonte de gravação foi encontrada.';
        } else {
          errorMessage += errorMsg;
        }
        
        this.$emit('error', errorMessage);
      } finally {
        this.loading = false;
      }
    },
    
    selectCamera(camera) {
      this.selectedCamera = camera;
      console.log("Câmera selecionada:", this.selectedCamera);
    },
    
    selectDisplay(display) {
      this.selectedDisplay = display;
      console.log("Display selecionado:", this.selectedDisplay);
    },
    
    getSourceDescription(source) {
      if (source.type === 'screen') {
        return `Tela ${source.display_id || ''} - ${source.width || 0}x${source.height || 0}`;
      } else {
        return source.appName || 'Aplicação';
      }
    },
    
    async startRecording() {
      try {
        const haCamera = this.selectedCamera !== null;
        
        console.log("=== DEBUG GRAVAÇÃO ===");
        console.log("selectedCamera:", this.selectedCamera);
        console.log("selectedDisplay:", this.selectedDisplay);
        console.log("haCamera:", haCamera);
        console.log("Tipo de gravação:", haCamera ? 'PIP' : 'SCREEN-ONLY');
        
        // Verificar se há display selecionado
        if (!this.selectedDisplay) {
          throw new Error("Nenhuma tela selecionada para gravação");
        }

        const sourceConfig = {
          type: haCamera ? 'pip' : 'screen-only',
          display: this.selectedDisplay,
          camera: this.selectedCamera,
          pipPosition: this.pipPosition,
          pipSize: this.pipSize,
          includeAudio: this.includeAudio,
          microphoneId: this.selectedMicrophone
        };

        console.log("Configuração mapeada:", sourceConfig);

        // Usar uma abordagem mais simples por enquanto
        if (haCamera) {
          console.log("🎬 Iniciando gravação PIP...");
          await this.startPIPRecordingSimple();
        } else {
          console.log("🖥️ Iniciando gravação apenas da tela...");
          await this.startScreenOnlyRecordingSimple(sourceConfig);
        }
        
        this.$emit('recording-started', sourceConfig);
        this.closeModal();
      } catch (error) {
        console.error("Erro ao iniciar gravação:", error);
        let errorMessage = 'Erro ao iniciar gravação: ';
        
        // Verificar se error.message existe e é string
        const errorMsg = error.message || error.toString() || 'Erro desconhecido';
        
        if (errorMsg.includes('Stream não foi criado')) {
          errorMessage += 'Não foi possível acessar a fonte selecionada. Verifique as permissões.';
        } else if (errorMsg.includes('Usuário cancelou') || errorMsg.includes('User cancelled')) {
          errorMessage += 'Seleção de tela cancelada pelo usuário.';
        } else if (errorMsg.includes('API de mídia não está disponível') || errorMsg.includes('getDisplayMedia')) {
          errorMessage += 'Funcionalidade de gravação não está disponível neste navegador.';
        } else if (errorMsg.includes('Nenhuma track de vídeo')) {
          errorMessage += 'Não foi possível obter vídeo da fonte selecionada.';
        } else if (errorMsg.includes('não é suportada') || errorMsg.includes('Not supported')) {
          errorMessage += 'Captura de tela não é suportada neste navegador/contexto.';
        } else {
          errorMessage += errorMsg;
        }
        
        this.$emit('error', errorMessage);
      }
    },

    async startScreenOnlyRecordingSimple(sourceConfig) {
      console.log("🖥️ Iniciando gravação completa da tela...");
      
      try {
        // 1. Obter stream da tela
        const constraints = {
          audio: sourceConfig.includeAudio ? {
            mandatory: {
              chromeMediaSource: 'desktop'
            }
          } : false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceConfig.display.id,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30
            }
          }
        };

        console.log("📋 Constraints:", constraints);
        this.recordingStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("✅ Stream da tela obtido:", this.recordingStream);

        // 2. Adicionar áudio do microfone se selecionado
        if (sourceConfig.microphoneId) {
          console.log("🎤 Adicionando áudio do microfone...");
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: sourceConfig.microphoneId } }
            });
            
            // Misturar áudios
            const audioTracks = [];
            this.recordingStream.getAudioTracks().forEach(track => audioTracks.push(track));
            micStream.getAudioTracks().forEach(track => audioTracks.push(track));
            
            // Criar novo stream com vídeo + áudios
            const mixedStream = new MediaStream();
            this.recordingStream.getVideoTracks().forEach(track => mixedStream.addTrack(track));
            audioTracks.forEach(track => mixedStream.addTrack(track));
            
            this.recordingStream = mixedStream;
            console.log("✅ Áudio do microfone adicionado");
          } catch (micError) {
            console.warn("⚠️ Erro ao adicionar microfone:", micError);
          }
        }

        // 3. Configurar MediaRecorder
        this.chunks = [];
        this.mediaRecorder = new MediaRecorder(this.recordingStream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
            console.log("📦 Chunk gravado:", event.data.size, "bytes");
          }
        };

        this.mediaRecorder.onstop = async () => {
          console.log("🛑 Gravação parada, salvando arquivo...");
          await this.saveRecording();
        };

        this.mediaRecorder.onerror = (event) => {
          console.error("❌ Erro na gravação:", event.error);
        };

        // 4. Iniciar gravação
        this.mediaRecorder.start(1000); // Salvar chunks a cada segundo
        console.log("🎬 Gravação iniciada!");

        // Expor métodos para parar a gravação
        window.currentRecording = {
          stop: () => this.stopRecording(),
          mediaRecorder: this.mediaRecorder,
          stream: this.recordingStream
        };

      } catch (error) {
        console.error("❌ Erro ao iniciar gravação:", error);
        throw error;
      }
    },

    async stopRecording() {
      console.log("🛑 Parando gravação...");
      
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      
      // Limpar stream principal
      if (this.recordingStream) {
        this.recordingStream.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
      }
      
      // Limpar streams do PIP se existirem
      if (window.currentRecording) {
        if (window.currentRecording.screenStream) {
          window.currentRecording.screenStream.getTracks().forEach(track => track.stop());
        }
        if (window.currentRecording.cameraStream) {
          window.currentRecording.cameraStream.getTracks().forEach(track => track.stop());
        }
        if (window.currentRecording.microphoneStream) {
          window.currentRecording.microphoneStream.getTracks().forEach(track => track.stop());
        }
      }
    },

    async saveRecording() {
      console.log("💾 Salvando gravação...");
      
      if (this.chunks.length === 0) {
        console.warn("⚠️ Nenhum chunk para salvar");
        return;
      }

      try {
        // Criar blob do vídeo
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        console.log("📹 Blob criado:", blob.size, "bytes");

        // Converter para ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Gerar nome do arquivo
        const timestamp = Date.now();
        const filename = `${timestamp}.mp4`;
        
        console.log("💾 Salvando via IPC:", filename);
        
        // Usar handler corrigido
        const result = await window.electron.ipcRenderer.invoke('write-file-fixed', {
          arrayBuffers: [uint8Array],
          filePath: filename
        });
        
        console.log("✅ Arquivo salvo:", result);
        // alert(`Gravação salva como: ${filename}`);
        
      } catch (error) {
        console.error("❌ Erro ao salvar:", error);
        
        // Tentar método alternativo de salvamento
        try {
          console.log("🔄 Tentando método alternativo...");
          const blob = new Blob(this.chunks, { type: 'video/webm' });
          
          const timestamp = Date.now();
          const filename = `recording-${timestamp}.webm`;
          
          // Criar um link de download como fallback
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          alert(`Gravação baixada como: ${filename}`);
          
        } catch (fallbackError) {
          console.error("❌ Erro no fallback:", fallbackError);
          alert("Erro ao salvar gravação: " + error.message);
        }
      } finally {
        this.chunks = [];
      }
    },

    async startPIPRecordingSimple() {
      console.log("🎬 Iniciando gravação PIP completa...");
      
      try {
        // 1. Obter stream da tela
        console.log("📺 Obtendo stream da tela...");
        const screenConstraints = {
          audio: this.includeAudio ? {
            mandatory: {
              chromeMediaSource: 'desktop'
            }
          } : false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: this.selectedDisplay.id,
              maxWidth: 1920,
              maxHeight: 1080,
              maxFrameRate: 30
            }
          }
        };

        const screenStream = await navigator.mediaDevices.getUserMedia(screenConstraints);
        console.log("✅ Stream da tela obtido:", screenStream);

        // 2. Obter stream da câmera
        console.log("📹 Obtendo stream da câmera...");
        const cameraConstraints = {
          video: {
            deviceId: { exact: this.selectedCamera.deviceId },
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false // Áudio da câmera será separado se necessário
        };

        const cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
        console.log("✅ Stream da câmera obtido:", cameraStream);

        // 3. Obter áudio do microfone se selecionado
        let microphoneStream = null;
        if (this.selectedMicrophone) {
          console.log("🎤 Obtendo stream do microfone...");
          try {
            microphoneStream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: this.selectedMicrophone } },
              video: false
            });
            console.log("✅ Stream do microfone obtido:", microphoneStream);
          } catch (micError) {
            console.warn("⚠️ Erro ao obter microfone:", micError);
          }
        }

        // 4. Criar canvas para mixing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        // Criar elementos de vídeo
        const screenVideo = document.createElement('video');
        const cameraVideo = document.createElement('video');
        
        screenVideo.srcObject = screenStream;
        cameraVideo.srcObject = cameraStream;
        
        screenVideo.muted = true;
        cameraVideo.muted = true;
        
        await Promise.all([
          new Promise(resolve => { screenVideo.onloadedmetadata = resolve; screenVideo.play(); }),
          new Promise(resolve => { cameraVideo.onloadedmetadata = resolve; cameraVideo.play(); })
        ]);

        console.log("🎥 Vídeos carregados e reproduzindo");

        // 5. Calcular posição e tamanho do PIP
        const pipSizes = {
          small: { width: 160, height: 120 },
          medium: { width: 320, height: 240 },
          large: { width: 480, height: 360 }
        };

        const pipSize = pipSizes[this.pipSize] || pipSizes.medium;
        
        const pipPositions = {
          'top-left': { x: 20, y: 20 },
          'top-right': { x: canvas.width - pipSize.width - 20, y: 20 },
          'bottom-left': { x: 20, y: canvas.height - pipSize.height - 20 },
          'bottom-right': { x: canvas.width - pipSize.width - 20, y: canvas.height - pipSize.height - 20 }
        };

        const pipPosition = pipPositions[this.pipPosition] || pipPositions['bottom-right'];

        console.log("📐 Configuração PIP:", { position: pipPosition, size: pipSize });

        // 6. Função de renderização
        const renderFrame = () => {
          // Desenhar tela de fundo
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          
          // Desenhar câmera PIP
          ctx.drawImage(
            cameraVideo, 
            pipPosition.x, 
            pipPosition.y, 
            pipSize.width, 
            pipSize.height
          );
          
          // Adicionar borda ao PIP
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipPosition.x, pipPosition.y, pipSize.width, pipSize.height);
        };

        // 7. Capturar stream do canvas
        const canvasStream = canvas.captureStream(30);
        console.log("🎨 Stream do canvas criado:", canvasStream);

        // 8. Mixar áudios
        const audioTracks = [];
        
        // Áudio da tela
        if (screenStream.getAudioTracks().length > 0) {
          screenStream.getAudioTracks().forEach(track => audioTracks.push(track));
          console.log("🔊 Áudio da tela adicionado");
        }
        
        // Áudio do microfone
        if (microphoneStream && microphoneStream.getAudioTracks().length > 0) {
          microphoneStream.getAudioTracks().forEach(track => audioTracks.push(track));
          console.log("🎙️ Áudio do microfone adicionado");
        }

        // 9. Criar stream final
        const finalStream = new MediaStream();
        
        // Adicionar vídeo do canvas
        canvasStream.getVideoTracks().forEach(track => finalStream.addTrack(track));
        
        // Adicionar áudios
        audioTracks.forEach(track => finalStream.addTrack(track));

        console.log("🎬 Stream final criado:", finalStream);

        // 10. Configurar MediaRecorder
        this.chunks = [];
        this.mediaRecorder = new MediaRecorder(finalStream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
            console.log("📦 Chunk PIP gravado:", event.data.size, "bytes");
          }
        };

        this.mediaRecorder.onstop = async () => {
          console.log("🛑 Gravação PIP parada, salvando arquivo...");
          
          // Parar renderização
          clearTimeout(renderLoop);
          
          // Limpar recursos
          screenVideo.srcObject = null;
          cameraVideo.srcObject = null;
          screenStream.getTracks().forEach(track => track.stop());
          cameraStream.getTracks().forEach(track => track.stop());
          if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
          }
          
          await this.saveRecording();
        };

        this.mediaRecorder.onerror = (event) => {
          console.error("❌ Erro na gravação PIP:", event.error);
        };

        // 11. Iniciar loop de renderização (usando setTimeout para funcionar em background)
        let renderLoop;
        const animate = () => {
          renderFrame();
          renderLoop = setTimeout(animate, 16); // ~60fps (1000ms/60 ≈ 16ms)
        };
        animate();

        // 12. Iniciar gravação
        this.mediaRecorder.start(1000);
        console.log("🎬 Gravação PIP iniciada!");

        // Salvar referências para parar
        this.recordingStream = finalStream;
        window.currentRecording = {
          stop: () => this.stopRecording(),
          mediaRecorder: this.mediaRecorder,
          stream: finalStream,
          screenStream: screenStream,
          cameraStream: cameraStream,
          microphoneStream: microphoneStream
        };

      } catch (error) {
        console.error("❌ Erro ao iniciar gravação PIP:", error);
        throw error;
      }
    },
    
    closeModal() {
      this.$emit('close');
      this.selectedCamera = null;
      this.selectedDisplay = null;
      this.selectedMicrophone = '';
      this.pipPosition = 'bottom-right';
      this.pipSize = 'medium';
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #E1E8ED;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #EDF2F7;
  color: #2D3748;
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

/* Novos estilos para PIP */
.pip-info {
  text-align: center;
  padding: 16px;
  background: #0066FF;
  color: white;
  border-radius: 6px;
  margin-bottom: 20px;
}

.pip-info p {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.section {
  margin-bottom: 20px;
  padding: 16px;
  border: none;
  border-radius: 6px;
  background: #F5F7FA;
}

.section h4 {
  margin: 0 0 14px 0;
  color: #2D3748;
  font-size: 16px;
  font-weight: 600;
}

/* Estilos para previews das telas */
.display-sources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.source-preview-item {
  border: none;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.source-preview-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.source-preview-item.selected {
  background: #EBF5FF;
  box-shadow: 0 0 0 2px #0066FF;
}

.source-thumbnail-container {
  position: relative;
  margin-bottom: 10px;
}

.source-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.source-type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.source-name {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-description {
  color: #6c757d;
  font-size: 12px;
  line-height: 1.3;
}

.loading-sources {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.loading-sources p {
  margin: 0;
  font-size: 16px;
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
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.source-item-list:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.source-item-list.selected {
  background: #EBF5FF;
  box-shadow: 0 0 0 2px #0066FF;
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

.pip-controls {
  margin-top: 16px;
  padding: 16px;
  background: #EBF5FF;
  border-radius: 6px;
  border: none;
}

.pip-controls h4 {
  margin: 0 0 12px 0;
  color: #2D3748;
  font-size: 14px;
  font-weight: 600;
}

.pip-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.setting-group label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.setting-group select {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.setting-group select:focus {
  outline: none;
  box-shadow: 0 0 0 2px #0066FF;
}

.setting-group select:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.section-description {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.no-camera-option {
  background: #f8f9fa;
  border-style: dashed !important;
}

.no-camera-option:hover {
  background: #e9ecef;
}

.no-camera-option.selected {
  background: #fff3cd;
  border-color: #ffc107 !important;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #E1E8ED;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #ffffff;
  border-radius: 0 0 8px 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #E2E8F0;
  color: #4A5568;
}

.btn-secondary:hover {
  background: #CBD5E0;
}

.btn-primary {
  background: #0066FF;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052CC;
}

.btn:disabled {
  background: #E2E8F0;
  color: #A0AEC0;
  cursor: not-allowed;
}
</style>
