<template>
    <div class="timeline-item" @click="handleClick" :style="{ width: itemWidth + 'px' }">
        <div class="item-content">
            <h3>{{ title }}</h3>
        </div>
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
        }
    },
    methods: {
        handleClick() {
            this.$emit('item-clicked', this.item);
        }
    },
    computed: {
        itemWidth() {
            const pixelsPerSecond = 10;
            return this.item.duration * pixelsPerSecond;
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
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.3s;
    height: auto;
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