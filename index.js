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

  mainWindow.loadFile("index.html");

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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("save-dialog", async () => {
  // dialog.showErrorBox("Save Dialog - index");
  const { filePath } = await dialog.showSaveDialog({
    title: "Save recording",
    defaultPath: `vid-${Date.now()}`,
  });
  return { filePath };
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
