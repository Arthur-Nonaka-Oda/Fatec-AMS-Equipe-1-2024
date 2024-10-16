const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  session,
  desktopCapturer,
} = require("electron");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL('http://localhost:8080');
  // mainWindow.loadFile(path.join(__dirname, "../index.html"));

  session
    .fromPartition("default")
    .setPermissionRequestHandler((webContents, permission, callback) => {
      let allowedPermissions = ["audioCapture", "desktopCapture"];

      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        console.error(`Blocked '${permission}'.`);

        callback(false);
      }
    });
}

function createModalWindow(parentWindow) {
  const modalWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: parentWindow, // Makes this a modal
    modal: true, // This makes the window modal
    show: false, // Show the window only when it's ready
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  modalWindow.loadFile(path.join(__dirname, '../modal/save-dialog-modal.html'));

  modalWindow.once('ready-to-show', () => {
    modalWindow.show();
  });

  return modalWindow;
}


app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

const videosDir = path.join(__dirname, '../videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir);
}

fs.watch(videosDir, async (eventType, filename) => {
  console.log(`Event Type: ${eventType}, Filename: ${filename}`); // Adiciona log para depuração
  if (eventType === 'rename' && filename && path.extname(filename) === '.mp4') {
    const filePath = path.join(videosDir, filename);
    console.log(`File Path: ${filePath}`); // Adiciona log para depuração
    if (fs.existsSync(filePath)) {
      try {
        // Espera um curto período para garantir que o arquivo esteja completamente escrito
        await new Promise(resolve => setTimeout(resolve, 1500));
        const base64Data = await fileToBase64(filePath);
        console.log(`Base64 Data Length: ${base64Data.length}`); // Adiciona log para depuração
        mainWindow.webContents.send('video-saved', { filePath, data: base64Data });
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  }
});

function fileToBase64(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        reject('Error reading file.');
        return;
      }
      console.log(`File Size: ${data.length}`); // Adiciona log para depuração
      const base64Data = data.toString('base64');
      resolve(base64Data);
    });
  });
}

fileToBlob = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        reject('Error reading file.');
        return;
      }
      const blob = new Blob([data], { type: 'video/mp4' });
      resolve(blob);
    });
  });
}

// ipcMain.handle("save-dialog", async () => {
//   // dialog.showErrorBox("Save Dialog - index");
//   const {fileName} = await createModalWindow(mainWindow);
//   const { filePath } = await dialog.showSaveDialog({
//     title: "Save recording",
//     defaultPath: `vid-${Date.now()}`,
//   });
//   return { fileName };
// });

ipcMain.handle("videos-recorded", async () => {
  try {
    const files = fs.readdirSync(videosDir);
    const videoFiles = files.filter(file => path.extname(file) === '.mp4');
    const videoDataArray = [];

    for (const filename of videoFiles) {
      const filePath = path.join(videosDir, filename);
      console.log(`Processing File: ${filePath}`); // Adiciona log para depuração

      if (fs.existsSync(filePath)) {
        try {
          // Espera um curto período para garantir que o arquivo esteja completamente escrito
          await new Promise(resolve => setTimeout(resolve, 500));
          const base64Data = await fileToBase64(filePath);
          console.log(`Base64 Data Length: ${base64Data.length}`); // Adiciona log para depuração
          videoDataArray.push({ filePath, data: base64Data });
        } catch (error) {
          console.error('Error converting file to base64:', error);
        }
      }
    }

    return videoDataArray;
  } catch (error) {
    console.error('Error reading video directory:', error);
    throw error;
  }
});


ipcMain.handle('save-dialog', (event) => {
  const modalWindow = createModalWindow(mainWindow);

  return new Promise((resolve, reject) => {
    ipcMain.once('dialog-ok', (event, inputValue) => {
      modalWindow.close();
      resolve({ result: 'ok', fileName: inputValue });
    });

    ipcMain.once('dialog-cancel', () => {
      modalWindow.close();
      resolve({ result: 'cancel' });
    });
  });

  // ipcMain.once('dialog-ok', (event, fileName) => {
  //   modalWindow.close();
  //   event.sender.send('custom-dialog-result', { result: 'ok', fileName });
  // });

  // ipcMain.once('dialog-cancel', () => {
  //   modalWindow.close();
  //   event.sender.send('custom-dialog-result', { result: 'cancel' });
  // });

  // return { fileName };
});

ipcMain.handle("import-dialog", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Selecione o arquivo",
    properties: ["openFile"],
  });
  // fs.stat(filePaths[0], (err, stats) => {
  //   const sizeBytes = stats.size;
  //   const sizeMb = sizeBytes / (1024 * 1024);
  // })
  return { filePath: filePaths[0], name: path.basename(filePaths[0]) };
});

ipcMain.handle("teste", async () => {
  console.log("teste");
})

ipcMain.handle("permission-dialog", async () => {
  const response = dialog.showMessageBoxSync({
    type: "question",
    buttons: ["OK", "Cancel"],
    title: "Permissão do Microfone",
    message:
      "Este aplicativo precisa de permissão para usar o microfone. Por favor, conceda a permissão nas configurações do sistema.",
  });

  return { filePath };
});

ipcMain.handle("write-file", async (event, { arrayBuffers, filePath }) => {

  const outputFilePath = `${filePath}.mp4`;
  const buffer = Buffer.concat(arrayBuffers.map((chunk) => Buffer.from(chunk)));
  const tempFilePath = `${filePath}.temp.webm`;

  fs.writeFile(tempFilePath, buffer, (err) => {
    if (err) {
      console.log(err);
    } else {
      ffmpeg(tempFilePath)
        .outputOptions("-c:v", "libx264", "-preset", "ultrafast")
        .save(outputFilePath)
        .on("end", () => {
          fs.unlink(tempFilePath, (err) => {
            if (err) {
              console.error("Error writing file", err);
            } else {
              dialog.showMessageBox({
                type: "info",
                title: "Sucesso",
                message: "Video salvo com sucesso!",
              });
            }
          });
        })
        .on("error", console.error);
    }
  });
});

ipcMain.handle("select-screen", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });
    return sources[0];
  } catch (err) {
    console.log(err);
  }
});
