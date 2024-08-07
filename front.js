
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