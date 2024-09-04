<template>
    <div class="timeline" @dragover="handleDragOver" @drop="handleDrop">
        <div class="time" @mousemove="grabMove" @mouseup="grabDone">
            <div class="timecursor" :style="{ left: cursorPosition + 'px' }" @mousedown="grabTime">{{ currentTime }}</div>
            <div class="time-markers">
                <div v-for="second in totalSeconds" :key="second" class="time-marker">
                    {{ formatTime(second) }}
                </div>
            </div>
        </div>
        <div class="layers">
            <TimeLineItem v-for="(video, index) in videos" :key="index" :title="video.name" :index="index" @item-clicked="handleItemClicked"/>
        </div>
    </div>
</template>

<script>
import TimeLineItem from './TimeLineItem.vue';

export default {
    props: {
        videos: {
            type: Array,
        },
        timeline: {
            type: Object,
            required: true
        }
    },
    components: {
        TimeLineItem
    },
    data() {
        return {
            isGrabbing: false,
            currentTime: '00:00:00',
            cursorPosition: 0,
            totalSeconds: 300 // 5 minutos
        };
    },
    mounted() {
        this.totalSeconds = 100;
        document.addEventListener('mousemove', this.grabMove);
        document.addEventListener('mouseup', this.grabDone);
    },
    beforeDestroy() {
        document.removeEventListener('mousemove', this.grabMove);
        document.removeEventListener('mouseup', this.grabDone);
    },
    methods: {
        grabMove(event) {
            if (this.isGrabbing) {
                const timelineRect = this.$el.querySelector('.time').getBoundingClientRect();
                let newPosition = event.clientX - timelineRect.left;
                newPosition = Math.max(0, Math.min(newPosition, timelineRect.width));
                this.cursorPosition = newPosition;
                this.updateCurrentTime();
            }
        },
        grabDone() {
            this.isGrabbing = false;
        },
        grabTime() {
            this.isGrabbing = true;
        },
        handleDragOver(event) {
            event.preventDefault();
        },
        handleDrop(event) {
            const videoData = event.dataTransfer.getData('video');
            const video = JSON.parse(videoData);
            this.timeline.addVideo(video);
        },
        handleItemClicked(index) {
            this.timeline.removeVideo(index);
            console.log(this.timeline.listVideos());
        },
        formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        },
        updateCurrentTime() {
            const timelineWidth = this.$el.querySelector('.time').clientWidth;
            const secondsPerPixel = this.totalSeconds / timelineWidth;
            const currentTimeInSeconds = Math.round(this.cursorPosition * secondsPerPixel);
            this.timeline.setCurrentSecond(currentTimeInSeconds);
            this.currentTime = this.formatTime(currentTimeInSeconds);
        },
    }
};
</script>

<style scoped>
.timeline {
    position: absolute;
    bottom: 0;
    height: 33%;
    border: 1px solid #ccc;
    background-color: #0d185e;
    height: 30%;
    overflow-y: hidden;
    overflow-x: scroll ;
    width: 100%;
}

.timeline::-webkit-scrollbar {
    height: 20px; 
}

.timeline::-webkit-scrollbar-track {
    background: #5a6ac2 !important;
}

.timeline::-webkit-scrollbar-thumb {
    height: 17px;
    background-color: #133a8d;
    border-radius: 0px;
    border: 2px solid #5a6ac2;
}

.time {
    user-select: none;
    width: fit-content;
    height: 15%;
    background-color: #cccccc00;
    display: flex;
    align-items: start;
    position: relative;

}

.timecursor {
    width: 65px;
    height: 25px;
    line-height: 25px;
    position: absolute;
    background-color: #ce2323;
    border-radius: 30px;
    top: 0px;
    font-family: Inter;
    font-size: 12px;
    color: white;
    z-index: 2!important;
    text-align: center;
    margin-top: 8px;
    transition-property: transform;
    transition-duration: .2s;
    transition-timing-function: cubic-bezier(.05,.03,.35,1);
    user-select: none;
    transform: translateX(-50%); /* Centralizar o cursor */
}

.timecursor:hover {
    transform: scale(1.12) translateX(-50%);
    cursor: pointer;
}

.timecursor:after {
    transition-property: transform, margin-top;
    transition-duration: .25s;
    transition-timing-function: cubic-bezier(.05,.03,.35,1);
    content: "";
    display: block;
    height: 100vh;
    width: 2px;
    background-color: #ce2323;
    margin-left: 32.5px;
    position: absolute;
    z-index: 2!important;
}

.time-markers {
    display: flex;
    flex-grow: 1;
    width: fit-content;
    overflow-x: hidden; /* Remover overflow horizontal */
    /* height: 40px; */
}

.time-marker {
    user-select: none;
    width: 70px;
    text-align: center;
    font-family: Inter;
    font-size: 12px;
    color: rgb(255, 255, 255);
    padding-top: 7px;
    box-sizing: border-box;
    position: relative;
    padding-bottom: 10px;
    /* height: auto; */
}

.time-marker::after {
    content: "";
    position: absolute;
    bottom: 0px; /* Ajustar para alinhar com a borda inferior */
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 10px; /* Altura da linha vertical */
    background-color: #ffffff; /* Cor da linha vertical */
}

.layers {
    height: 85%;
    display: flex;
    align-items: center;
    flex-direction: row;
}
</style>