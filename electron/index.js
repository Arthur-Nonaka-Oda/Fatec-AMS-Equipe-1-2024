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

ipcMain.handle('combine-videos', async (event, { videosInfo }) => {
  console.log("combine");
  const outputFilePath = path.join(app.getPath('userData'), 'combined.mp4');

  await combineVideos(videosInfo, outputFilePath);

  const videoBase64 = await fileToBase64(outputFilePath);

  return videoBase64;
});

function checkVideoDurations(videoPaths) {
  return Promise.all(videoPaths.map(videoPath => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        resolve(metadata.format.duration);
      });
    });
  }));
}

function normalizeFrameRate(videoPath, outputDir) {
  return new Promise((resolve, reject) => {
    console.log("frame-rate");
    const outputFilePath = path.join(outputDir, path.basename(videoPath));
    ffmpeg(videoPath)
      .outputOptions(['-r 30']) // Define a taxa de quadros para 30 fps
      .on('end', () => {
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputFilePath);
  });
  //Expandir essa função para receber mais comportamentos/funções, mudar o framerate 30->24.
  //Aplicar a bitrate para 1000 há 1500 kb.
  //Mudar o nome da função 
}


async function combineVideos(videosInfo, outputFilePath) {
  console.log(videosInfo);
  const videosPaths = videosInfo.map(video => video.filePath)

  const normalizedVideoPaths = await Promise.all(videosPaths.map(videoPath => normalizeFrameRate(videoPath, app.getPath('userData'))));
  console.log('Normalized Video Paths:', normalizedVideoPaths);
  const listFilePath = path.join(app.getPath('userData'), 'videos.txt');
  const fileContent = normalizedVideoPaths.map(videoPath => `file '${videoPath}'`).join('\n');
  fs.writeFileSync(listFilePath, fileContent);
  return new Promise((resolve, reject) => {

    const ffmpegCommand = ffmpeg();
    let filterParts = [];
    let videoInputs = [];
    let audioInputs = [];

    // Iterate through your videosInfo array,
    // which should include filePath, startTime, and endTime for each video.
    videosInfo.forEach((video, index) => {
      // Add each video as an input.
      ffmpegCommand.input(video.filePath);

      // Build the video trim filter for the current input.
      filterParts.push(
        `[${index}:v]trim=start=${video.startTime}:end=${video.endTime},setpts=PTS-STARTPTS[v${index}]`
      );

      // Build the audio trim filter for the current input.
      filterParts.push(
        `[${index}:a]atrim=start=${video.startTime}:end=${video.endTime},asetpts=PTS-STARTPTS[a${index}]`
      );

      // Save the labels for later concatenation.
      videoInputs.push(`[v${index}]`);
      audioInputs.push(`[a${index}]`);
    });

    // Build the concat filter. This assumes each input has both video and audio.
    filterParts.push(
      `${videoInputs.join('')}${audioInputs.join('')}concat=n=${videosInfo.length}:v=1:a=1[outv][outa]`
    );

    const filterComplex = filterParts.join('; ');

    console.log("Filter Complex:", filterComplex);

    ffmpeg()
      // .complexFilter(filterComplex)
      .input(listFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c:v libx264', '-crf 32', '-preset ultrafast', '-filter:v', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2', '-c:a aac', '-b:a 192k'])
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('codecData', (data) => {
        console.log('Input is ' + data.audio + ' audio with ' + data.video + ' video');
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percentage + '% done');
      })
      .on('end', () => {
        console.log('Videos combined successfully');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error combining videos:', err);
        reject(err);
      })
      .output(outputFilePath)
      .run();
  });
}


ipcMain.handle('renderize', async (event, { videosPaths }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "Save recording",
    defaultPath: `vid-${Date.now()}`,
  });

  if (filePath) {
    const outputFilePath = filePath.endsWith('.mp4') ? filePath : `${filePath}.mp4`;
    await renderizeVideo(videosPaths, outputFilePath);
    return true;
  } else {
    throw new Error('No file path selected');
  }
});


async function renderizeVideo(videoPaths, outputFilePath) {
  try {
    // Paralelizar a normalização dos vídeos
    const normalizedVideoPaths = await Promise.all(
      videoPaths.map(videoPath => normalizeFrameRate(videoPath, app.getPath('userData')))
    );
    console.log('Normalized Video Paths:', normalizedVideoPaths);

    const listFilePath = path.join(app.getPath('userData'), 'videos.txt');
    const fileContent = normalizedVideoPaths.map(videoPath => `file '${videoPath}'`).join('\n');
    fs.writeFileSync(listFilePath, fileContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',
          '-crf 10', // Valor de CRF mais baixo para maior qualidade
          '-preset slow', // Preset mais lento para maior qualidade
          '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-c:a aac',
          '-b:a 192k'
        ])
        .on('start', (commandLine) => {
          console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('codecData', (data) => {
          console.log('Input is ' + data.audio + ' audio with ' + data.video + ' video');
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Video rendered successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error rendering video:', err);
          reject(err);
        })
        .output(outputFilePath)
        .run();
    });
  } catch (error) {
    console.error('Error normalizing videos:', error);
    throw error;
  }
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
        }//
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

// esta dando erro vou arrumar na proxima aula -_-
ipcMain.handle("cut-video", async (event, { filePath, startTime, duration }) => {
  const outputFilePath = path.join(app.getPath("userData"), "cut-video.mp4");

  try {
    await cutVideo(filePath, startTime, duration, outputFilePath);
    const videoBase64 = await fileToBase64(outputFilePath);
    return videoBase64; // Retorna o vídeo cortado em base64 para o frontend
  } catch (error) {
    console.error("Error cutting video:", error);
    throw new Error("Error cutting video.");
  }
});

function cutVideo(filePath, startTime, duration, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .setStartTime(startTime) // Define o início do corte (ex: "00:00:30" para 30 segundos)
      .setDuration(duration)  // Define a duração do corte (ex: "00:00:10" para 10 segundos)
      .output(outputFilePath)
      .outputOptions("-c:v libx264", "-crf 23", "-preset fast", "-c:a aac")
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log("Video cut successfully.");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error cutting video:", err);
        reject(err);
      })
      .run();
  });
}
// esta dando erro vou arrumar na proxima aula -_-
