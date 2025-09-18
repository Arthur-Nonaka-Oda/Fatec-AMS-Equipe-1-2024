// Remover require do electron para evitar problemas no preload
// const { ipcRenderer } = require("electron");
const path = require("path");

function Recorder() {
    this.mediaRecorder = null;
    this.chunks = [];
    
    // Função para obter ipcRenderer de forma segura
    this.getIpcRenderer = function() {
        if (window.electron && window.electron.ipcRenderer) {
            return window.electron.ipcRenderer;
        }
        throw new Error("IPC Renderer não está disponível");
    };
    this.currentStream = null;

    // Obter todas as fontes de captura disponíveis
    this.getAvailableSources = async function () {
        try {
            console.log("🔍 === INICIANDO OBTENÇÃO DE FONTES ===");

            // Inicializar structure de fontes
            const sources = {
                screens: [],
                windows: [],
                cameras: [],
                microphones: [],
                speakers: []
            };

            // 1. Testar chamada IPC para desktop sources
            console.log("📺 Tentando obter fontes de desktop via Electron...");
            let desktopSources = [];
            try {
                if (!window.electron) {
                    throw new Error("window.electron não está disponível");
                }
                if (!window.electron.ipcRenderer) {
                    throw new Error("window.electron.ipcRenderer não está disponível");
                }
                
                const ipcRenderer = this.getIpcRenderer();
                desktopSources = await ipcRenderer.invoke("get-desktop-sources");
                console.log("✅ Desktop sources obtidas:", desktopSources.length);
            } catch (desktopError) {
                console.error("❌ Erro ao obter desktop sources:", desktopError);
                // Continuar sem desktop sources
            }

            // 2. Testar enumerateDevices
            console.log("🎥 Tentando obter dispositivos de mídia...");
            let mediaDevices = [];
            try {
                if (!navigator.mediaDevices) {
                    throw new Error("navigator.mediaDevices não está disponível");
                }
                if (!navigator.mediaDevices.enumerateDevices) {
                    throw new Error("enumerateDevices não está disponível");
                }
                
                mediaDevices = await navigator.mediaDevices.enumerateDevices();
                console.log("✅ Media devices obtidos:", mediaDevices.length);
            } catch (mediaError) {
                console.error("❌ Erro ao obter media devices:", mediaError);
                // Continuar sem media devices
            }

            // 3. Filtrar e organizar fontes
            if (desktopSources.length > 0) {
                sources.screens = desktopSources.filter(source => source.type === 'screen');
                sources.windows = desktopSources.filter(source => source.type === 'window');
                console.log(`📱 Encontradas ${sources.screens.length} telas e ${sources.windows.length} janelas`);
            }

            if (mediaDevices.length > 0) {
                sources.cameras = mediaDevices.filter(device => device.kind === 'videoinput');
                sources.microphones = mediaDevices.filter(device => device.kind === 'audioinput');
                sources.speakers = mediaDevices.filter(device => device.kind === 'audiooutput');
                console.log(`🎤 Encontrados ${sources.cameras.length} câmeras, ${sources.microphones.length} microfones, ${sources.speakers.length} alto-falantes`);
            }

            console.log("📋 Fontes finais encontradas:", sources);
            return sources;
        } catch (error) {
            console.error("🚨 ERRO CRÍTICO ao obter fontes de captura:", error);
            console.error("Stack trace:", error.stack);
            throw error;
        }
    };

    // Verificar disponibilidade das APIs necessárias para Electron
    this.checkAPIAvailability = function () {
        console.log("🔍 === VERIFICAÇÃO DE APIs ===");
        const issues = [];

        // Verificar navigator.mediaDevices
        console.log("Verificando navigator.mediaDevices...");
        if (!navigator.mediaDevices) {
            console.error("❌ navigator.mediaDevices não está disponível");
            issues.push("navigator.mediaDevices não está disponível");
        } else {
            console.log("✅ navigator.mediaDevices está disponível");
            
            // Verificar getUserMedia
            console.log("Verificando getUserMedia...");
            if (!navigator.mediaDevices.getUserMedia) {
                console.error("❌ getUserMedia não está disponível");
                issues.push("getUserMedia não está disponível");
            } else {
                console.log("✅ getUserMedia está disponível");
            }

            // Verificar enumerateDevices
            console.log("Verificando enumerateDevices...");
            if (!navigator.mediaDevices.enumerateDevices) {
                console.error("❌ enumerateDevices não está disponível");
                issues.push("enumerateDevices não está disponível");
            } else {
                console.log("✅ enumerateDevices está disponível");
            }
        }

        // Verificar MediaRecorder
        console.log("Verificando MediaRecorder...");
        if (!window.MediaRecorder) {
            console.error("❌ MediaRecorder não está disponível");
            issues.push("MediaRecorder não está disponível");
        } else {
            console.log("✅ MediaRecorder está disponível");
        }

        // Verificar APIs do Electron
        console.log("Verificando APIs do Electron...");
        console.log("window.electron:", !!window.electron);
        if (window.electron) {
            console.log("window.electron.ipcRenderer:", !!window.electron.ipcRenderer);
        }
        
        if (!window.electron || !window.electron.ipcRenderer) {
            console.error("❌ APIs do Electron não estão disponíveis");
            issues.push("APIs do Electron não estão disponíveis");
        } else {
            console.log("✅ APIs do Electron estão disponíveis");
        }

        if (issues.length > 0) {
            const errorMessage = "APIs não disponíveis: " + issues.join(", ");
            console.error("🚨 ERRO NA VERIFICAÇÃO:", errorMessage);
            console.error("Contexto atual:", {
                protocol: window.location.protocol,
                userAgent: navigator.userAgent,
                electron: !!window.electron
            });
            throw new Error(errorMessage);
        }

        console.log("🎉 Todas as APIs necessárias estão disponíveis no Electron");
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

    // Método para gravação apenas da tela (sem câmera) - usando APIs do Electron
    this.startScreenOnlyRecording = async function(sourceConfig) {
        try {
            console.log("🖥️ === INICIANDO GRAVAÇÃO APENAS DA TELA (ELECTRON) ===");
            console.log("startScreenOnlyRecording - Configuração recebida:", sourceConfig);
            
            // 1. Obter stream da tela usando getUserMedia com sourceId do Electron
            console.log("📺 Obtendo stream da tela via Electron desktopCapturer...");
            let displayStream;
            
            if (!sourceConfig.display || !sourceConfig.display.id) {
                throw new Error("Nenhum display selecionado para gravação");
            }
            
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
            
            console.log("📋 Usando getUserMedia com constraints do Electron:", JSON.stringify(constraints, null, 2));
            
            try {
                displayStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("✅ Stream da tela obtido via Electron:", displayStream);
            } catch (mediaError) {
                console.error("❌ Erro ao obter stream da tela via Electron:", mediaError);
                
                if (mediaError.name === 'NotAllowedError') {
                    throw new Error("Usuário negou permissão para captura de tela");
                } else if (mediaError.name === 'NotFoundError') {
                    throw new Error("Fonte de tela não encontrada ou inválida");
                } else if (mediaError.name === 'OverconstrainedError') {
                    throw new Error("Configurações de captura não suportadas");
                } else {
                    throw new Error(`Erro ao capturar tela via Electron: ${mediaError.message || mediaError.name || 'Erro desconhecido'}`);
                }
            }
            
            // Verificar se é realmente uma tela e não uma câmera
            const videoTracks = displayStream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];
                console.log("� Analisando track de vídeo:");
                console.log("  - Label:", track.label);
                console.log("  - Kind:", track.kind);
                console.log("  - Settings:", track.getSettings());
                
                // Se o label contém palavras como 'camera', 'webcam', etc., pode ser uma câmera
                const cameraKeywords = ['camera', 'webcam', 'cam', 'facetime'];
                const isCamera = cameraKeywords.some(keyword => 
                    track.label.toLowerCase().includes(keyword)
                );
                
                if (isCamera) {
                    console.warn("⚠️ AVISO: O stream obtido parece ser uma câmera, não uma tela!");
                    console.warn("    Label do track:", track.label);
                }
            }
            
            // Verificar se o stream tem vídeo
            console.log("🎬 Video tracks encontradas:", videoTracks.length);
            if (videoTracks.length === 0) {
                throw new Error("Nenhuma track de vídeo encontrada no stream da tela");
            }
            
            // 2. Obter áudio do microfone se especificado
            let microphoneStream = null;
            if (sourceConfig.microphoneId) {
                console.log("🎤 Obtendo stream do microfone...");
                try {
                    microphoneStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: sourceConfig.microphoneId }
                        },
                        video: false
                    });
                    console.log("✅ Microfone obtido:", microphoneStream);
                } catch (micError) {
                    console.warn("⚠️ Erro ao obter microfone específico:", micError);
                }
            }
            
            // 3. Criar stream final
            let finalStream = displayStream;
            
            // Se há microfone, misturar os áudios
            if (microphoneStream) {
                console.log("🔀 Mixando áudios...");
                const audioTracks = [];
                
                // Áudio do sistema
                const dispAudioTracks = displayStream.getAudioTracks();
                if (dispAudioTracks && dispAudioTracks.length) {
                    console.log("🔊 Adicionando áudio do sistema:", dispAudioTracks.length, "tracks");
                    dispAudioTracks.forEach(t => audioTracks.push(t));
                }
                
                // Áudio do microfone
                const micAudio = microphoneStream.getAudioTracks();
                if (micAudio && micAudio.length) {
                    console.log("🎙️ Adicionando áudio do microfone:", micAudio.length, "tracks");
                    micAudio.forEach(t => audioTracks.push(t));
                }
                
                // Criar novo stream com vídeo da tela + áudios mixados
                finalStream = new MediaStream();
                const videoTrack = displayStream.getVideoTracks()[0];
                if (videoTrack) {
                    finalStream.addTrack(videoTrack);
                    console.log("✅ Video track adicionada ao stream final");
                }
                audioTracks.forEach(t => {
                    finalStream.addTrack(t);
                    console.log("✅ Audio track adicionada ao stream final");
                });
                
                console.log("📡 Stream final criado com", finalStream.getTracks().length, "tracks");
            } else {
                console.log("📡 Usando stream da tela diretamente (sem microfone)");
            }
            
            // 4. Configurar MediaRecorder
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
                    break;
                }
            }
            
            this.mediaRecorder = new MediaRecorder(finalStream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 5000000,
                audioBitsPerSecond: 128000
            });
            
            // 5. Configurar eventos do MediaRecorder
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                console.log("Gravação da tela parada, processando arquivo...");
                try {
                    // Parar streams
                    displayStream.getTracks().forEach(track => track.stop());
                    if (microphoneStream) {
                        microphoneStream.getTracks().forEach(track => track.stop());
                    }
                    
                    // Processar arquivo
                    const blob = new Blob(this.chunks, { type: selectedMimeType });
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = new Uint8Array(arrayBuffer);
                    
                    const videoName = `screen-${Date.now()}`;
                    const result = await ipcRenderer.invoke("write-file", {
                        arrayBuffers: [buffer],
                        filePath: path.join(__dirname, "../videos", videoName)
                    });
                    
                    console.log("Arquivo da tela salvo:", result);
                    
                    // Limpar dados
                    this.chunks = [];
                    this.currentStream = null;
                    this.mediaRecorder = null;
                } catch (error) {
                    console.error("Erro ao processar arquivo da tela:", error);
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erro do MediaRecorder (tela):', event.error);
            };

            // Detectar quando o usuário para o compartilhamento de tela
            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log("Compartilhamento de tela encerrado pelo usuário");
                this.stopRecording();
            });

            // 6. Iniciar gravação
            console.log("🔴 Iniciando MediaRecorder...");
            this.mediaRecorder.start(1000);
            this.currentStream = finalStream;
            
            console.log("✅ === GRAVAÇÃO DA TELA INICIADA COM SUCESSO ===");
            console.log("📊 Tracks no stream final:", finalStream.getTracks().map(t => t.kind));
            return true;
            
        } catch (error) {
            console.error("❌ Erro ao iniciar gravação da tela:", error);
            throw error;
        }
    };

    // Método para gravação PIP (Picture-in-Picture)
    this.startPIPRecording = async function (sourceConfig) {
        try {
            console.log("Iniciando gravação PIP com configuração:", sourceConfig);

            // 1. Obter stream da tela/display selecionado
            console.log("Obtendo stream da tela selecionada...");
            let displayStream;
            
            if (sourceConfig.display && sourceConfig.display.id) {
                // Usar o display específico selecionado pelo usuário
                console.log("Display selecionado:", sourceConfig.display);
                const constraints = {
                    audio: sourceConfig.includeAudio ? {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: sourceConfig.display.id
                    } : false,
                    video: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: sourceConfig.display.id,
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 }
                    }
                };
                
                console.log("Tentando getUserMedia com constraints:", JSON.stringify(constraints, null, 2));
                try {
                    displayStream = await navigator.mediaDevices.getUserMedia(constraints);
                    console.log("Stream obtido via getUserMedia:", displayStream);
                } catch (userMediaError) {
                    console.warn("getUserMedia falhou, tentando getDisplayMedia:", userMediaError);
                    // Fallback para getDisplayMedia
                    displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        },
                        audio: sourceConfig.includeAudio || false
                    });
                    console.log("Stream obtido via getDisplayMedia fallback:", displayStream);
                }
            } else {
                // Fallback para getDisplayMedia se não houver display específico
                console.log("Não há display específico, usando getDisplayMedia");
                displayStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 }
                    },
                    audio: sourceConfig.includeAudio || false
                });
                console.log("Stream obtido via getDisplayMedia:", displayStream);
            }

            // 2. Obter stream da câmera
            console.log("Obtendo stream da câmera...");
            const cameraConstraints = {
                video: {
                    deviceId: { exact: sourceConfig.camera.deviceId },
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: false  // NÃO capturar áudio da câmera aqui
            };

            const cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);

            // 2.1. Separadamente, obter áudio do microfone se especificado
            let microphoneStream = null;
            if (sourceConfig.microphoneId) {
                console.log("Obtendo stream do microfone...");
                try {
                    microphoneStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: { exact: sourceConfig.microphoneId }
                        },
                        video: false
                    });
                } catch (micError) {
                    console.warn("Erro ao obter microfone específico:", micError);
                    // Fallback para microfone padrão
                    try {
                        microphoneStream = await navigator.mediaDevices.getUserMedia({
                            audio: true,
                            video: false
                        });
                    } catch (fallbackError) {
                        console.warn("Erro ao obter microfone padrão:", fallbackError);
                    }
                }
            }

            // 3. Configurar canvas para mixing
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            // 4. Criar elementos de vídeo para as fontes
            const screenVideo = document.createElement('video');
            const cameraVideo = document.createElement('video');

            screenVideo.srcObject = displayStream;
            cameraVideo.srcObject = cameraStream;

            screenVideo.muted = true;
            cameraVideo.muted = true;

            await Promise.all([
                new Promise(resolve => {
                    screenVideo.onloadedmetadata = () => {
                        screenVideo.play();
                        resolve();
                    };
                }),
                new Promise(resolve => {
                    cameraVideo.onloadedmetadata = () => {
                        cameraVideo.play();
                        resolve();
                    };
                })
            ]);

            // 5. Calcular posição e tamanho do PIP
            const pipSizes = {
                small: 0.15,
                medium: 0.20,
                large: 0.25
            };

            const pipScale = pipSizes[sourceConfig.pipSize] || 0.20;
            const camW = canvas.width * pipScale;
            const camH = canvas.height * pipScale;

            let camX, camY;
            const margin = 20;

            switch (sourceConfig.pipPosition) {
                case 'top-left':
                    camX = margin;
                    camY = margin;
                    break;
                case 'top-right':
                    camX = canvas.width - camW - margin;
                    camY = margin;
                    break;
                case 'bottom-left':
                    camX = margin;
                    camY = canvas.height - camH - margin;
                    break;
                case 'bottom-right':
                default:
                    camX = canvas.width - camW - margin;
                    camY = canvas.height - camH - margin;
                    break;
            }

            // 6. Função de drawing loop
            let rafId;
            function drawFrame() {
                // Limpar canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Desenhar tela de fundo (esticada para canvas)
                ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

                // Desenhar sombra para destacar PIP
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(camX - 8, camY - 8, camW + 16, camH + 16);

                // Desenhar câmera PIP
                ctx.drawImage(cameraVideo, camX, camY, camW, camH);

                // Desenhar borda do PIP
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.strokeRect(camX, camY, camW, camH);
                ctx.restore();

                rafId = requestAnimationFrame(drawFrame);
            }

            // 7. Iniciar loop de desenho
            drawFrame();

            // 8. Criar stream do canvas
            const canvasStream = canvas.captureStream(30);

            // 9. Coletar faixas de áudio (sem duplicação)
            const audioTracks = [];

            // Áudio do sistema (displayStream) - prioritário
            const dispAudioTracks = displayStream.getAudioTracks();
            if (dispAudioTracks && dispAudioTracks.length) {
                console.log("Adicionando áudio do sistema:", dispAudioTracks.length, "tracks");
                dispAudioTracks.forEach(t => audioTracks.push(t));
            }

            // Microfone específico (se selecionado)
            if (microphoneStream) {
                const micAudio = microphoneStream.getAudioTracks();
                if (micAudio && micAudio.length) {
                    console.log("Adicionando áudio do microfone:", micAudio.length, "tracks");
                    micAudio.forEach(t => audioTracks.push(t));
                }
            }

            console.log("Total de faixas de áudio:", audioTracks.length);

            // 10. Criar stream final mixado
            const mixedStream = new MediaStream();
            const videoTrack = canvasStream.getVideoTracks()[0];
            if (videoTrack) mixedStream.addTrack(videoTrack);
            audioTracks.forEach(t => mixedStream.addTrack(t));

            // 11. Configurar MediaRecorder
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
                    break;
                }
            }

            this.mediaRecorder = new MediaRecorder(mixedStream, {
                mimeType: selectedMimeType,
                videoBitsPerSecond: 5000000,
                audioBitsPerSecond: 128000
            });

            // 12. Configurar eventos do MediaRecorder
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                console.log("Gravação PIP parada, processando arquivo...");
                try {
                    // Parar loop de desenho
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                    }

                    // Parar streams
                    displayStream.getTracks().forEach(track => track.stop());
                    cameraStream.getTracks().forEach(track => track.stop());
                    if (microphoneStream) {
                        microphoneStream.getTracks().forEach(track => track.stop());
                    }

                    // Processar arquivo
                    const blob = new Blob(this.chunks, { type: selectedMimeType });
                    const arrayBuffer = await blob.arrayBuffer();
                    const buffer = new Uint8Array(arrayBuffer);

                    const videoName = `pip-${Date.now()}`;
                    const result = await ipcRenderer.invoke("write-file", {
                        arrayBuffers: [buffer],
                        filePath: path.join(__dirname, "../videos", videoName)
                    });

                    console.log("Arquivo PIP salvo:", result);

                    // Limpar dados
                    this.chunks = [];
                    this.currentStream = null;
                    this.mediaRecorder = null;
                } catch (error) {
                    console.error("Erro ao processar arquivo PIP:", error);
                } finally {
                    // Limpar elementos criados
                    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                    if (screenVideo.parentNode) screenVideo.parentNode.removeChild(screenVideo);
                    if (cameraVideo.parentNode) cameraVideo.parentNode.removeChild(cameraVideo);
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('Erro do MediaRecorder PIP:', event.error);
            };

            // Detectar quando o usuário para o compartilhamento de tela
            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
                console.log("Compartilhamento de tela encerrado pelo usuário");
                this.stopRecording();
            });

            // 13. Iniciar gravação
            this.mediaRecorder.start(1000);
            this.currentStream = mixedStream;

            console.log("Gravação PIP iniciada com sucesso");
            return true;

        } catch (error) {
            console.error("Erro ao iniciar gravação PIP:", error);
            throw error;
        }
    };

    // Método para gravar com fonte específica (tela, janela ou câmera)
    this.startRecordingWithSource = async function (sourceConfig) {
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
    this.getScreenStream = async function (sourceConfig) {
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
    this.getCameraStream = async function (sourceConfig) {
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
    this.setupMediaRecorder = async function (stream) {
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