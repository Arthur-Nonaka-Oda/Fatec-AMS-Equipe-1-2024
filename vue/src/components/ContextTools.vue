<template>
    <div class="tools" :style="{ top: y + 'px', left: x + 'px', position: 'fixed' }">
        <button class="tool" @click="$emit('action', 'remover')">Excluir</button>
        <button class="tool" @click="$emit('action', 'recortar')">Recortar</button>
        <button class="tool" @click="$emit('action', 'copiar')">Copiar</button>
        <button class="tool" @click="$emit('action', 'colar')">Colar</button>
    </div>
</template>

<script>
export default {
    name: 'ContextTools',
    props: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },
    emits: ['action']
};
</script>

<style scoped>
.tools {
    display: flex;
    flex-direction: column;
    min-width: 120px;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
    z-index: 9999999;
}

.tool {
    padding: 8px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 1rem;
}

.tool:hover {
    background: #d1d0d0;
}
</style>