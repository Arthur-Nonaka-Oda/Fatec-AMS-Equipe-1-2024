
Vue.createApp({
    data() {
        return {
            isRecording: false,
            isPaused: false,
            showModal: false,
        }
    },
    computed: {
        recordImageSrc() {
            return this.isRecording ? './imagens/pararIcone.png' : './imagens/gravarIcone.png';
        },
        pauseImageSrc() {
            return this.isPaused ? './imagens/pauseIcone.png' : './imagens/playIcone.png';

        }
    },
    methods: {
        close() {
            this.showModal = false;
        },
        toggleRecording() {
            if (!this.isRecording) {
                window.electron.recorder().startRecording();
            } else {
                window.electron.recorder().stopRecording();
            }
            this.isRecording = !this.isRecording;
            this.isPaused = false;
        },
        pauseRecording() {
            if (!this.isPaused) {
                window.electron.recorder().pauseRecording();
            } else {
                window.electron.recorder().resumeRecording();
            }
            this.isPaused = !this.isPaused;
        }
    }
}).mount('#recordButtons');

Vue.createApp({
    methods: {
        importfile() {
            window.electron.Importer().importFile();
        }
    }
}).mount('#importButtons');

////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', () => {
    addVideoThumbnail('./imagens/sexta.mp4', 'Video Trigo');
});

// Função para adicionar miniaturas de vídeos à área de vídeos
function addVideoThumbnail(videoSrc, videoTitle) {
    const videosContainer = document.getElementById('videos');
    
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video-thumbnail';
    videoDiv.draggable = true;
    videoDiv.dataset.src = videoSrc;
    videoDiv.innerHTML = `
        <video src="${videoSrc}" controls width="150" preload="metadata"></video>
        <span>${videoTitle}</span>
    `;
    
    videoDiv.ondragstart = (event) => {
        event.dataTransfer.setData('text/plain', videoSrc); // Store the video source for later use
    };

    videosContainer.appendChild(videoDiv);
}

// Função para lidar com o arrasto do vídeo
document.getElementById('timeline').ondrop = (event) => {
    event.preventDefault();
    const videoSrc = event.dataTransfer.getData('text/plain');
    const startTime = event.clientX - document.getElementById('timeline').offsetLeft;
    addVideoToTimeline(videoSrc, startTime);
};

document.getElementById('timeline').ondragover = (event) => {
    event.preventDefault(); // Necessary to allow dropping
};

// Função para adicionar o vídeo à linha do tempo
function addVideoToTimeline(videoSrc, startTime) {
    const layers = document.getElementById('layers');
    const video = document.createElement('video');
    video.src = videoSrc;
    video.preload = 'metadata';

    // Cria uma camada para o vídeo
    const videoDiv = document.createElement('div');
    videoDiv.className = 'video-layer';
    videoDiv.draggable = true;
    videoDiv.style.left = `${startTime}px`;
    videoDiv.style.position = 'absolute';
    
    video.addEventListener('loadedmetadata', () => {
        // Calcula a largura com base na duração do vídeo
        const duration = video.duration; // Duração do vídeo em segundos
        const videoWidth = duration * 60; // 60 pixels por segundo, ajuste conforme necessário

        videoDiv.style.width = `${videoWidth}px`;
        
        // Adiciona o vídeo à camada
        videoDiv.appendChild(video);
        layers.appendChild(videoDiv);
    });

    videoDiv.ondragstart = (event) => {
        event.dataTransfer.setData('text/plain', startTime);
        videoDiv.classList.add('dragging');
    };

    videoDiv.ondragend = (event) => {
        const newLeft = event.clientX - document.getElementById('timeline').offsetLeft;
        videoDiv.style.left = `${Math.max(0, newLeft)}px`;
        videoDiv.classList.remove('dragging');
    };

    // Ajusta a posição do vídeo arrastado
    document.getElementById('timeline').onmousemove = (event) => {
        if (document.querySelector('.video-layer.dragging')) {
            const draggingVideo = document.querySelector('.video-layer.dragging');
            const newLeft = event.clientX - document.getElementById('timeline').offsetLeft;
            draggingVideo.style.left = `${Math.max(0, newLeft)}px`;
        }
    };
}
