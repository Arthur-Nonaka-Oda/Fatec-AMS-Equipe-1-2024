const { ipcRenderer } = require("electron");
const path = require("path");

function Recorder() {
    this.mediaRecorder = null;
    this.chunks = [];
    this.currentStream = null;
    
    // Obter todas as fontes de captura disponíveis
    this.getAvailableSources = async function() {
        try {
            console.log("Obtendo fontes de captura disponíveis...");
            
            // Verificar disponibilidade das APIs
            this.checkAPIAvailability();
            
            // Obter telas e janelas através do Electron
            const desktopSources = await ipcRenderer.invoke("get-desktop-sources");
            
            // Obter dispositivos de mídia (câmeras e microfones)
            const mediaDevices = await navigator.mediaDevices.enumerateDevices();
            
            const sources = {
                screens: desktopSources.filter(source => source.type === 'screen'),
                windows: desktopSources.filter(source => source.type === 'window'),
                cameras: mediaDevices.filter(device => device.kind === 'videoinput'),
                microphones: mediaDevices.filter(device => device.kind === 'audioinput'),
                speakers: mediaDevices.filter(device => device.kind === 'audiooutput')
            };
            
            console.log("Fontes encontradas:", sources);
            return sources;
        } catch (error) {
            console.error("Erro ao obter fontes de captura:", error);
            throw error;
        }
    };
    
    // Verificar disponibilidade das APIs necessárias
    this.checkAPIAvailability = function() {
        const issues = [];
        
        if (!navigator.mediaDevices) {
            issues.push("navigator.mediaDevices não está disponível");
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
            issues.push("getUserMedia não está disponível");
        }
        
        if (!navigator.mediaDevices.getDisplayMedia) {
            issues.push("getDisplayMedia não está disponível");
        }
        
        if (!navigator.mediaDevices.enumerateDevices) {
            issues.push("enumerateDevices não está disponível");
        }
        
        if (!window.MediaRecorder) {
            issues.push("MediaRecorder não está disponível");
        }
        
        if (issues.length > 0) {
            const errorMessage = "APIs não disponíveis: " + issues.join(", ");
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
        
        console.log("Todas as APIs necessárias estão disponíveis");
    };
    
    this.startCamera = async function () {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoElement.srcObject = stream;
          videoElement.play();
        } catch (error) {
          console.error('Erro ao acessar a câmera:', error);
        }
    }

    // Método para gravar com fonte específica (tela, janela ou câmera)
    this.startRecordingWithSource = async function(sourceConfig) {
        try {
            console.log("Iniciando gravação com configuração:", sourceConfig);
            console.log("Tipo recebido:", sourceConfig.type, "| Tipos válidos: screen, screens, window, windows, camera, cameras, display");
            
            let stream = null;
            
            // Verificar se mediaDevices está disponível
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("API de mídia não está disponível neste navegador");
            }
            
            if (sourceConfig.type === 'screen' || sourceConfig.type === 'screens' || 
                sourceConfig.type === 'window' || sourceConfig.type === 'windows') {
                // Para telas e janelas, usar SEMPRE getDisplayMedia que é mais confiável
                console.log("Obtendo stream de tela/janela usando getDisplayMedia...");
                
                if (!navigator.mediaDevices.getDisplayMedia) {
                    throw new Error("getDisplayMedia não está disponível - necessário para captura de tela");
                }
                
                try {
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            width: { ideal: 1920, max: 1920, min: 640 },
                            height: { ideal: 1080, max: 1080, min: 480 },
                            frameRate: { ideal: 30, max: 30, min: 15 }
                        },
                        audio: sourceConfig.includeAudio || false
                    });
                    
                    console.log("✅ Stream de tela obtido via getDisplayMedia");
                    
                    // Verificar se é realmente captura de tela
                    const videoTracks = stream.getVideoTracks();
                    if (videoTracks.length > 0) {
                        const settings = videoTracks[0].getSettings();
                        console.log("Configurações do stream de tela:", settings);
                        
                        if (settings.displaySurface) {
                            console.log("🖥️ Tipo de captura:", settings.displaySurface);
                            if (settings.displaySurface === 'browser') {
                                console.warn("⚠️ Capturando guia do navegador, não tela completa");
                            } else if (settings.displaySurface === 'window') {
                                console.log("🪟 Capturando janela específica");
                            } else if (settings.displaySurface === 'monitor') {
                                console.log("🖥️ Capturando monitor/tela completa");
                            }
                        }
                    }
                } catch (displayError) {
                    console.error("❌ getDisplayMedia falhou:", displayError);
                    if (displayError.name === 'NotAllowedError') {
                        throw new Error("Usuário cancelou a seleção de tela ou negou permissão");
                    } else if (displayError.name === 'NotFoundError') {
                        throw new Error("Nenhuma fonte de captura encontrada");
                    } else {
                        throw new Error("Erro ao capturar tela: " + displayError.message);
                    }
                }
            } else if (sourceConfig.type === 'camera' || sourceConfig.type === 'cameras') {
                // Gravar câmera específica
                console.log("Obtendo stream de câmera...");
                stream = await this.getCameraStream(sourceConfig);
            } else if (sourceConfig.type === 'display') {
                // Usar getDisplayMedia (deixa o usuário escolher)
                console.log("Obtendo stream via getDisplayMedia...");
                try {
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            width: { ideal: 1920, max: 1920, min: 640 },
                            height: { ideal: 1080, max: 1080, min: 480 },
                            frameRate: { ideal: 30, max: 30, min: 15 }
                        },
                        audio: sourceConfig.includeAudio || false
                    });
                } catch (displayError) {
                    console.error("Erro no getDisplayMedia:", displayError);
                    throw new Error("Usuário cancelou a seleção de tela ou erro no getDisplayMedia: " + displayError.message);
                }
            } else {
                throw new Error("Tipo de fonte não reconhecido: " + sourceConfig.type + ". Tipos válidos: screen(s), window(s), camera(s), display");
            }
            
            if (!stream) {
                throw new Error("Stream não foi criado - verifique as configurações da fonte");
            }
            
            // Verificar se o stream tem tracks válidas
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            
            console.log(`Stream obtido - Video tracks: ${videoTracks.length}, Audio tracks: ${audioTracks.length}`);
            
            if (videoTracks.length === 0) {
                throw new Error("Nenhuma track de vídeo encontrada no stream");
            }
            
            this.currentStream = stream;
            await this.setupMediaRecorder(stream);
            
            console.log("Gravação iniciada com sucesso");
            return true;
        } catch (error) {
            console.error("Erro ao iniciar gravação com fonte:", error);
            
            // Limpar stream em caso de erro
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.currentStream = null;
            }
            
            throw error;
        }
    };
    
    // Obter stream de tela/janela específica
    this.getScreenStream = async function(sourceConfig) {
        try {
            console.log("Obtendo stream de tela/janela com configuração:", sourceConfig);
            console.log("Source ID:", sourceConfig.source.id);
            console.log("Source name:", sourceConfig.source.name);
            
            // Verificar se o source ID é válido para desktop
            if (!sourceConfig.source.id || !sourceConfig.source.id.includes('screen') && !sourceConfig.source.id.includes('window')) {
                console.warn("ID da fonte não parece ser de desktop:", sourceConfig.source.id);
            }
            
            // Configuração moderna para Electron - captura de desktop
            const constraints = {
                audio: sourceConfig.includeAudio ? {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceConfig.source.id
                } : false,
                video: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sourceConfig.source.id,
                    width: { ideal: 1920, max: 1920, min: 640 },
                    height: { ideal: 1080, max: 1080, min: 480 },
                    frameRate: { ideal: 30, max: 30, min: 15 }
                }
            };

            console.log("Constraints para getUserMedia (desktop):", JSON.stringify(constraints, null, 2));
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Stream obtido com sucesso:", stream);
            
            // Verificar se realmente obteve stream de desktop
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const settings = videoTracks[0].getSettings();
                console.log("Configurações da track de vídeo:", settings);
                
                // Verificar se é realmente captura de desktop
                if (settings.displaySurface) {
                    console.log("Tipo de superfície de display:", settings.displaySurface);
                }
                if (settings.logicalSurface !== undefined) {
                    console.log("Superfície lógica:", settings.logicalSurface);
                }
            }
            
            return stream;
        } catch (error) {
            console.error("Erro ao obter stream de tela/janela:", error);
            
            // Fallback: tentar com getDisplayMedia se getUserMedia falhar
            try {
                console.log("Tentando fallback com getDisplayMedia...");
                
                if (!navigator.mediaDevices.getDisplayMedia) {
                    throw new Error("getDisplayMedia não está disponível para fallback");
                }
                
                const displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920, max: 1920, min: 640 },
                        height: { ideal: 1080, max: 1080, min: 480 },
                        frameRate: { ideal: 30, max: 30, min: 15 }
                    },
                    audio: sourceConfig.includeAudio || false
                });
                
                console.log("Stream obtido via getDisplayMedia fallback:", displayStream);
                return displayStream;
            } catch (fallbackError) {
                console.error("Erro no fallback getDisplayMedia:", fallbackError);
                throw new Error(`Falha ao obter stream da fonte ${sourceConfig.source.name}: ${error.message}. Fallback também falhou: ${fallbackError.message}`);
            }
        }
    };
    
    // Obter stream de câmera específica
    this.getCameraStream = async function(sourceConfig) {
        try {
            console.log("Obtendo stream de câmera com configuração:", sourceConfig);
            
            const constraints = {
                video: {
                    deviceId: { exact: sourceConfig.source.deviceId },
                    width: { ideal: 1280, max: 1920, min: 640 },
                    height: { ideal: 720, max: 1080, min: 480 },
                    frameRate: { ideal: 30, max: 30, min: 15 }
                },
                audio: sourceConfig.microphoneId ? {
                    deviceId: { exact: sourceConfig.microphoneId }
                } : sourceConfig.includeAudio || false
            };

            console.log("Constraints para câmera:", constraints);
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Stream de câmera obtido com sucesso:", stream);
            
            return stream;
        } catch (error) {
            console.error("Erro ao obter stream de câmera:", error);
            
            // Fallback: tentar sem deviceId específico
            try {
                console.log("Tentando fallback para câmera padrão...");
                const simpleConstraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: sourceConfig.includeAudio || false
                };
                
                const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
                console.log("Stream de câmera obtido via fallback:", stream);
                return stream;
            } catch (fallbackError) {
                console.error("Erro no fallback da câmera:", fallbackError);
                throw new Error(`Falha ao obter stream da câmera: ${fallbackError.message}`);
            }
        }
    };
    
    // Configurar MediaRecorder
    this.setupMediaRecorder = async function(stream) {
        // Verificar codecs suportados
        const supportedTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm'
        ];
        
        let selectedMimeType = 'video/webm';
        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                selectedMimeType = type;
                console.log("Usando codec:", type);
                break;
            }
        }
        
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: selectedMimeType,
            videoBitsPerSecond: 5000000, // 5 Mbps
            audioBitsPerSecond: 128000   // 128 kbps
        });

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
                console.log("Chunk gravado:", e.data.size, "bytes");
            }
        };
        
        this.mediaRecorder.onstop = async () => {
            console.log("Gravação parada, processando arquivo...");
            try {
                // Para todas as tracks do stream
                if (this.currentStream) {
                    this.currentStream.getTracks().forEach(track => {
                        track.stop();
                        console.log("Track parada:", track.kind);
                    });
                    this.currentStream = null;
                }

                if (this.chunks.length === 0) {
                    console.error("Nenhum chunk foi gravado");
                    return;
                }

                const fileName = `${Date.now()}`;
                const filePath = path.join(__dirname, "../", "videos", fileName);

                const arrayBuffers = await Promise.all(
                    this.chunks.map((blob) => {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsArrayBuffer(blob);
                        });
                    })
                );
                
                console.log("Enviando arquivo para o processo principal...");
                await ipcRenderer.invoke('write-file', { arrayBuffers, filePath });
                console.log("Arquivo salvo com sucesso");
            } catch (error) {
                console.error('Erro ao processar gravação:', error);
            } finally {
                this.chunks = [];
            }
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('Erro do MediaRecorder:', event.error);
        };

        // Detectar quando o usuário para o compartilhamento de tela
        if (stream.getVideoTracks().length > 0) {
            stream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log("Usuário parou o compartilhamento");
                this.stopRecording();
            });
        }

        this.mediaRecorder.start(1000); // Grava em chunks de 1 segundo
    };
    this.startRecordingModern = async function () {
        try {
            console.log("Iniciando gravação com getDisplayMedia...");
            
            // Usar getDisplayMedia para captura de tela (mais estável)
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    sampleRate: 44100
                }
            });
            
            this.currentStream = displayStream;
            console.log("Stream de display obtido com sucesso");
            
            // Verificar codecs suportados
            const supportedTypes = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=h264,opus',
                'video/webm'
            ];
            
            let selectedMimeType = 'video/webm';
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    console.log("Usando codec:", type);
                    break;
                }
            }
            
            this.mediaRecorder = new MediaRecorder(displayStream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 5000000, // 5 Mbps
                audioBitsPerSecond: 128000   // 128 kbps
            });

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                    console.log("Chunk gravado:", e.data.size, "bytes");
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                console.log("Gravação parada, processando arquivo...");
                try {
                    // Para todas as tracks do stream
                    if (this.currentStream) {
                        this.currentStream.getTracks().forEach(track => {
                            track.stop();
                            console.log("Track parada:", track.kind);
                        });
                        this.currentStream = null;
                    }

                    if (this.chunks.length === 0) {
                        console.error("Nenhum chunk foi gravado");
                        return;
                    }

                    const fileName = `${Date.now()}`;
                    const filePath = path.join(__dirname, "../", "videos", fileName);

                    const arrayBuffers = await Promise.all(
                        this.chunks.map((blob) => {
                            return new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsArrayBuffer(blob);
                            });
                        })
                    );
                    
                    console.log("Enviando arquivo para o processo principal...");
                    await ipcRenderer.invoke('write-file', { arrayBuffers, filePath });
                    console.log("Arquivo salvo com sucesso");
                } catch (error) {
                    console.error('Erro ao processar gravação:', error);
                } finally {
                    this.chunks = [];
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erro do MediaRecorder:', event.error);
            };

            // Detectar quando o usuário para o compartilhamento de tela
            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log("Usuário parou o compartilhamento de tela");
                this.stopRecording();
            });

            this.mediaRecorder.start(1000); // Grava em chunks de 1 segundo
            console.log("Gravação iniciada com getDisplayMedia");
            return true;
        } catch (err) {
            console.error("Erro ao iniciar gravação moderna:", err);
            throw err;
        }
    }

    this.startRecording = async function () {
        try {
            console.log("Iniciando seleção de tela...");
            const selectedScreen = await ipcRenderer.invoke("select-screen");
            
            if (!selectedScreen || !selectedScreen.id) {
                throw new Error("Nenhuma tela foi selecionada");
            }
            
            console.log("Tela selecionada:", selectedScreen.name);

            // Configuração corrigida para captura de desktop
            const constraints = {
                audio: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: selectedScreen.id,
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: selectedScreen.id,
                        minWidth: 1280,
                        maxWidth: 1920,
                        minHeight: 720,
                        maxHeight: 1080,
                        maxFrameRate: 30
                    }
                }
            };

            console.log("Solicitando acesso ao getUserMedia...");
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            console.log("Stream obtido com sucesso");
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                    console.log("Chunk gravado:", e.data.size, "bytes");
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                console.log("Gravação parada, processando arquivo...");
                try {
                    // Para todas as tracks do stream
                    stream.getTracks().forEach(track => {
                        track.stop();
                        console.log("Track parada:", track.kind);
                    });

                    if (this.chunks.length === 0) {
                        console.error("Nenhum chunk foi gravado");
                        return;
                    }

                    const fileName = `${Date.now()}`;
                    const filePath = path.join(__dirname, "../", "videos", fileName);

                    const arrayBuffers = await Promise.all(
                        this.chunks.map((blob) => {
                            return new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsArrayBuffer(blob);
                            });
                        })
                    );
                    
                    console.log("Enviando arquivo para o processo principal...");
                    await ipcRenderer.invoke('write-file', { arrayBuffers, filePath });
                    console.log("Arquivo salvo com sucesso");
                } catch (error) {
                    console.error('Erro ao processar gravação:', error);
                } finally {
                    this.chunks = [];
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erro do MediaRecorder:', event.error);
            };

            this.mediaRecorder.start(1000); // Grava em chunks de 1 segundo
            console.log("Gravação iniciada");
        } catch (err) {
            console.error("Erro ao iniciar gravação:", err);
            throw err;
        }
    };

    this.resumeRecording = async function () {
        this.mediaRecorder.resume();
    }
    this.pauseRecording = async function () {
        this.mediaRecorder.pause();
    }

    this.stopRecording = async function () {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                console.log("Parando gravação...");
                this.mediaRecorder.stop();
                
                // Aguarda um pouco para garantir que o evento onstop seja processado
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log("MediaRecorder não está ativo");
            }
        } catch (error) {
            console.error("Erro ao parar gravação:", error);
        }
    }
}

module.exports = Recorder;