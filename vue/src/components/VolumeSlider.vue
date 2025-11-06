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
    background: #F5F7FA;
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
}

.volume-slider input[type="range"] {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #0066FF;
    border-radius: 4px;
    outline: none;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #0066FF;
    cursor: pointer;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
}

.volume-slider input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #0066FF;
    cursor: pointer;
    transition: all 0.2s ease;
}

.volume-slider input[type="range"]::-moz-range-thumb:hover {
    transform: scale(1.1);
}
</style>