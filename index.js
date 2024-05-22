const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg')
const path = require("path");
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('save-dialog', async () => {
  // dialog.showErrorBox("Save Dialog - index");
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save recording',
    defaultPath: `vid-${Date.now()}.webm`
  });
  return { filePath };
});

ipcMain.handle('write-file', async (event, { chunks, filePath }) => {
  const buffer = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
  const tempFilePath = `${filePath}.temp.webm`;

  fs.writeFile(tempFilePath, buffer, err => {
    if (err) {
      console.log(err)
    } else {
      ffmpeg(tempFilePath)
      .outputOptions('-c:v libx264', '-present ultrafast')
      .save(filePath)
      .on('end', () => {
        fs.unlink(tempFilePath, err => {
          if (err) {
            console.log(err);
          }
        })
      })
      .on('error', console.error);
    }
  })

  // const blob = new Blob(chunks, { type: 'video/webm; codecs=vp9' });
  // blob.arrayBuffer().then(buffer => {
  //   fs.writeFile(filePath, Buffer.from(buffer), err => {
  //     if (err) {
  //       console.error('Error writing file', err);
  //     } else {
  //       console.log('File written successfully');
  //     }
  //   });
  // });
});