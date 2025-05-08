<template>
    <div class="volume-slider">
        <input type="range" min="0" max="1" step="0.01" :value="volume"
            @input="$emit('update-volume', parseFloat($event.target.value))" />
    </div>
</template>
<script>
export default {
    props: {
        volume: {
            type: Number,
            required: true
        }
    }
}
</script>

<style scoped>
.volume-slider {
    display: flex;
    align-items: center;
    background-color: aliceblue;
    width: 100%;
    /* height: 5px; */
    padding: 5px;
}
</style>