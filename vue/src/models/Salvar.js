const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.handle('salvar-projeto', async (event, { nomeProjeto, dados }) => {
  try {
    const baseDir = path.join(__dirname, 'projects');
    const projetoDir = path.join(baseDir, nomeProjeto);

    // Cria a pasta "projects" se não existir
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }

    // Cria a subpasta com o nome do projeto
    if (!fs.existsSync(projetoDir)) {
      fs.mkdirSync(projetoDir);
    }

    // Caminho do arquivo JSON a ser salvo
    const filePath = path.join(projetoDir, 'projeto.json');

    // Salva o conteúdo como JSON
    fs.writeFileSync(filePath, JSON.stringify(dados, null, 2), 'utf-8');

    return { sucesso: true, caminho: filePath };
  } catch (error) {
    console.error('Erro ao salvar o projeto:', error);
    return { sucesso: false, erro: error.message };
  }
});
