// main/loadProject.js
const { dialog } = require('electron');
const fs = require('fs');

function loadProject(win, callback) {
  dialog.showOpenDialog(win, {
    title: 'Carregar Projeto',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          console.error('Erro ao ler o projeto:', err);
        } else {
          try {
            const projectData = JSON.parse(data);
            callback(projectData);
          } catch (e) {
            console.error('Erro ao interpretar JSON:', e);
          }
        }
      });
    }
  });
}

module.exports = { loadProject };
