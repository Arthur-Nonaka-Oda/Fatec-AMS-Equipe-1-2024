// main/saveProject.js
const { dialog } = require('electron');
const fs = require('fs');

function saveProject(win, projectData) {
  const jsonData = JSON.stringify(projectData, null, 2);

  dialog.showSaveDialog(win, {
    title: 'Salvar Projeto',
    defaultPath: 'meu-projeto.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, jsonData, (err) => {
        if (err) {
          console.error('Erro ao salvar projeto:', err);
        } else {
          console.log('Projeto salvo em:', result.filePath);
        }
      });
    }
  });
}

module.exports = { saveProject };
