Vue.createApp({
    data() {
        return {
            isRecording: false,
            isPaused: false,
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
            if(!this.isPaused) {
                window.electron.recorder().pauseRecording();
            } else {
                window.electron.recorder().resumeRecording();
            }
            this.isPaused = !this.isPaused;
        }
    }
}).mount('#recordButtons');