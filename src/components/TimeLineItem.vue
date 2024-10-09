<template>
    <div class="timeline-item" @click="handleClick" :style="{ width: itemWidth + 'px' }" >
        <img class="item-content" :src="item.url">
    </div>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            required: true
        },
        index: {
            type: Number,
            required: true
        },
        item: {
            type: Object,
            required: true,
        },
        minimumScaleTime: {
            type: Number,
            required: true
        },
        layerIndex: {
            type: Number,
            required: true
        },
        selectVideo:{
            type: Object,
        }
    },
    methods: {
        handleClick() {
            this.$emit('item-clicked', { item: this.item, layerIndex: this.layerIndex });
        }
    },
    computed: {
        itemWidth() {
            const secondsPerPixel = this.minimumScaleTime / 10; // Ajuste conforme necessário
            return this.item.duration / secondsPerPixel;
        }
    }
};
</script>

<style scoped>
.timeline-item {
    display: flex;
    flex-direction: column;
    /* padding: 10px; */
    /* margin: 5px 0; */
    background-color: #fff;
    /* border: 1px solid #ccc; */
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    height: auto;
    height: 45px;
    /* Altura específica */
    overflow: hidden;
    /* Esconde a parte da imagem que ultrapassa o contêiner */
    position: relative;
}

img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* Ajusta a imagem para cobrir o contêiner */
    object-position: center;
    /* Centraliza a imagem */
}

.timeline-item:hover {
    background-color: #f0f0f0;
}

.item-content {
    display: flex;
    flex-direction: column;
    font-size: 1rem;
}
</style>