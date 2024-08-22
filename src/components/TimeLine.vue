<template>
    <div class="linha-do-tempo">
        <div id="playarea">
            <div id="play" @click="playTrigger()"></div>
        </div>
        <div id="markerback"></div>
        <div id="timeline" @mousemove="grabMove()" @mouseup="grabDone()">
            <div id="timecursor" class="noselect" @mousedown="grabTime()">00:00:00</div>
            <div id="timemarker"></div>
            <div id="layers">
                <TimeLineItem v-for="(video, index) in videos" :key="index" :title="video.name" :index="index" @item-clicked="handleItemClicked"/>
            </div>
        </div>
        <div id="timeback"></div>
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
            isPlaying: false,
            isGrabbing: false,
            currentTime: '00:00:00'
        };
    },
    // computed: {
    //     videos() {
    //         return this.$timeline.listVideos();
    //     }
    // },
    methods: {
        playTrigger() {
            this.isPlaying = !this.isPlaying;
            console.log(this.isPlaying ? 'Playing' : 'Paused');
        },
        grabMove(event) {
            if (this.isGrabbing) {
                // Lógica para mover o cursor de tempo
                console.log('Moving time cursor', event.clientX);
            }
        },
        grabDone() {
            this.isGrabbing = false;
            console.log('Stopped grabbing');
        },
        grabTime() {
            this.isGrabbing = true;
            console.log('Started grabbing');
        },

        handleItemClicked(index) {
            this.timeline.removeVideo(index);
            console.log(this.timeline.listVideos());
        }
    }
};
</script>