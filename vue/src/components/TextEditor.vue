<template>
  <div class="quillEditorContainer">
    <div class="quillEditor">
      <quill-editor
        v-model="contentHtml"
        ref="refQuillEditor"
        :options="quillOptions"
      />
      <button type="submit" class="buttonSave" @click="saveText">Salvar</button>
    </div>
  </div>
</template>

<script>
import { quillEditor } from 'vue3-quill';

export default {
  name: 'VueQuillEditorComponent',
  components: {
    quillEditor
  },
  data() {
    return {
      contentHtml: '',
      quillOptions: {
        placeholder: 'Digite aqui... -_-',
        readonly: false,
      },
    };
  },
  methods: {
    saveText() {
      localStorage.setItem('content', this.contentHtml);
      alert('Texto salvo com sucesso!');
    },
  },
};
</script>

<style scoped>
.quillEditorContainer {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quill-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 200px;
  background: #fff;
}

.buttonSave {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.buttonSave:hover {
  background-color: #0056b3;
}

.ql-editor::before {
  font-size: 80px; /* Aumente o tamanho da fonte conforme necessário */
  color: #ff0000; /* Cor do placeholder */
}
</style>