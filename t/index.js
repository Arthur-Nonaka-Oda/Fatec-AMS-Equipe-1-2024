const { app, BrowserWindow, ipcMain } = require("electron/main");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const path = require("node:path");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      
    },
  });
  win.loadFile("index.html");
};
app.whenReady().then(() => {
  createWindow();
});

ipcMain.on("write-file", async (event, chunks, filePath) => {
  const blob = new Blob(chunks, { type: "video/webm; codecs=vp9" });
  const buffer = Buffer.from(await blob.arrayBuffer());
  if (filePath) {
    const tempFile = `./temp.webm`;
    fs.writeFileSync(tempFile, buffer);
    ffmpeg(tempFile)
      .outputOptions("-c:v", "libx264")
      .save(`${filePath}.mp4`)
      .on("end", () => fs.unlinkSync(tempFile));
    return true;
  }
  return false;
});

ipcMain.handle("save-dialog", async () => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.mp4`,
  });
  return { filePath };
});
