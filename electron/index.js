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
const os = require("os"); // Importar o módulo 'os' para o diretório temporário

let mainWindow;
let currentFfmpegProcess = null; // Variável global para armazenar o processo FFmpeg ativo

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

  // Passa o 'event' para combineVideos para que o progresso possa ser enviado
  await combineVideos(videosInfo, outputFilePath, event);

  const videoBase64 = await fileToBase64(outputFilePath);

  return videoBase64;
});

ipcMain.handle('create-video-from-image', async (event, { filePath, duration }) => {
  const outputFilePath = path.join(app.getPath('userData'), `image-video-${Date.now()}.mp4`);

  try {
    // Passa o 'event' para a função para que ela possa enviar atualizações de progresso
    await createVideoFromImage(filePath, duration, outputFilePath, event);
    const videoBase64 = await fileToBase64(outputFilePath);
    return videoBase64; // Retorna o vídeo em base64 para o frontend
  } catch (error) {
    console.error('Error creating video from image:', error);
    throw new Error('Error creating video from image.');
  }
});

function createVideoFromImage(imagePath, duration, outputFilePath, eventSender) { // Adicionado eventSender
  return new Promise((resolve, reject) => {
    const command = ffmpeg(imagePath)
      .inputOptions(['-loop', '1'])
      .outputOptions([
        '-t', duration,
        '-c:v', 'libx264',
        '-r', '20',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1280:720'
      ])
      .output(outputFilePath)
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
        currentFfmpegProcess = command; // <--- ATRIBUI O PROCESSO ATUAL
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
        if (eventSender) {
          eventSender.sender.send('renderize-progress', progress.percent); // <--- ENVIA O PROGRESSO
        }
      })
      .on('end', () => {
        console.log('Video created successfully.');
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO
        resolve();
      })
      .on('error', (err) => {
        console.error('Error creating video from image:', err);
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO EM CASO DE ERRO
        reject(err);
      });

    command.run();
  });
}

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


async function combineVideos(videosInfo, outputFilePath, eventSender) { // Adicionado eventSender
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

    videosInfo.forEach((video, index) => {
      ffmpegCommand.input(video.filePath);

      filterParts.push(
        `[<span class="math-inline">\{index\}\:v\]trim\=start\=</span>{video.startTime}:end=<span class="math-inline">\{video\.endTime\},setpts\=PTS\-STARTPTS\[v</span>{index}]`
      );

      filterParts.push(
        `[<span class="math-inline">\{index\}\:a\]atrim\=start\=</span>{video.startTime}:end=<span class="math-inline">\{video\.endTime\},asetpts\=PTS\-STARTPTS\[a</span>{index}]`
      );

      videoInputs.push(`[v${index}]`);
      audioInputs.push(`[a${index}]`);
    });

    filterParts.push(
      `<span class="math-inline">\{videoInputs\.join\(''\)\}</span>{audioInputs.join('')}concat=n=${videosInfo.length}:v=1:a=1[outv][outa]`
    );

    const filterComplex = filterParts.join('; ');

    console.log("Filter Complex:", filterComplex);

    // AQUI ESTÁ A MUDANÇA PRINCIPAL
    const command = ffmpeg()
      .input(listFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c:v libx264', '-crf 32', '-preset ultrafast', '-filter:v', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2', '-c:a aac', '-b:a 192k'])
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
        currentFfmpegProcess = command; // <--- ATRIBUI O PROCESSO ATUAL
      })
      .on('codecData', (data) => {
        console.log('Input is ' + data.audio + ' audio with ' + data.video + ' video');
      })
      .on('progress', (progress) => {
        console.log(progress);
        console.log('Processing: ' + progress.percent + '% done');
        if (eventSender) {
          eventSender.sender.send('renderize-progress', progress.percent); // <--- ENVIA O PROGRESSO
        }
      })
      .on('end', () => {
        console.log('Videos combined successfully');
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO
        resolve();
      })
      .on('error', (err) => {
        console.error('Error combining videos:', err);
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO EM CASO DE ERRO
        reject(err);
      })
      .output(outputFilePath);

    command.run();
  });
}


ipcMain.handle('renderize', async (event, { videos, audios }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "Save recording",
    defaultPath: `vid-${Date.now()}`,
  });

  if (filePath) {
    const outputFilePath = filePath.endsWith('.mp4') ? filePath : `${filePath}.mp4`;

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Passa o 'event' para a função para que ela possa enviar atualizações de progresso
      await renderizeVideo([...videos, ...audios], outputFilePath, event);
      return true;
    } catch (error) {
      console.error('Error during video rendering:', error.message || error);
      throw new Error('Failed to render video.');
    }
  } else {
    throw new Error('No file path selected');
  }
});

let currentRenderProcess = null; // Para controlar o processo de renderização

async function renderizeVideo(mediaItems, outputFilePath, eventSender) { // Adicionado eventSender
  return new Promise(async (resolve, reject) => {
    try {
      const tempDir = path.join(os.tmpdir(), `media_render_${Date.now()}`); // Usar os.tmpdir()
      fs.mkdirSync(tempDir, { recursive: true });

      // Helper functions to detect file types (já estão no seu código, mas certifique-se)
      function isImageFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(ext);
      }

      function isAudioFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'].includes(ext);
      }

      const visuals = mediaItems.filter(item => !isAudioFile(item.filePath));
      const audios = mediaItems.filter(item => isAudioFile(item.filePath));

      const visualSegmentPromises = visuals.map((item, index) => {
        return new Promise((resolveSegment, rejectSegment) => {
          const segmentPath = path.join(tempDir, `visual_segment_${index}.mp4`);

          if (isImageFile(item.filePath)) {
            const duration = item.endTime - item.startTime || 5;

            const cmd = ffmpeg()
              .input(item.filePath)
              .inputOptions(['-loop 1'])
              .outputOptions([
                `-t ${duration}`,
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-r 30',
                '-an',
                '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
              ])
              .output(segmentPath)
              .on('end', () => resolveSegment({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: duration
              }))
              .on('error', rejectSegment);
            cmd.run();
          } else {
            const cmd = ffmpeg(item.filePath)
              .setStartTime(item.startTime)
              .setDuration(item.endTime - item.startTime)
              .outputOptions([
                '-c:v libx264',
                '-an',
                '-avoid_negative_ts make_zero',
                '-reset_timestamps 1',
                '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
              ])
              .output(segmentPath)
              .on('end', () => resolveSegment({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: item.endTime - item.startTime
              }))
              .on('error', rejectSegment);
            cmd.run();
          }
        });
      });

      const audioSegmentPromises = audios.map((item, index) => {
        return new Promise((resolveSegment, rejectSegment) => {
          const segmentPath = path.join(tempDir, `audio_segment_${index}.wav`);

          const cmd = ffmpeg(item.filePath)
            .audioFilters(`volume=${(item.volume ?? 100) / 100}`)
            .setStartTime(item.startTime)
            .setDuration(item.endTime - item.startTime)
            .outputOptions([
              '-c:a pcm_s16le',
              '-ar 44100',
              '-ac 2',
              '-vn'
            ])
            .output(segmentPath)
            .on('end', () => resolveSegment({
              path: segmentPath,
              startTime: item.startTime,
              endTime: item.endTime,
              duration: item.endTime - item.startTime,
              position: item.startTime
            }))
            .on('error', (err, stdout, stderr) => {
              console.error(`Error processing audio:`, err);
              console.error(`FFmpeg stderr: ${stderr}`);
              rejectSegment(err);
            });
          cmd.run();
        });
      });

      const [visualSegments, audioSegments] = await Promise.all([
        Promise.all(visualSegmentPromises),
        Promise.all(audioSegmentPromises)
      ]);

      visualSegments.sort((a, b) => a.startTime - b.startTime);
      audioSegments.sort((a, b) => a.startTime - b.startTime);

      // Concat visual segments
      const videoListPath = path.join(tempDir, 'video_list.txt');
      let videoContent = '';
      visualSegments.forEach(segment => {
        videoContent += `file '${segment.path.replace(/'/g, "'\\''")}'` + '\n';
      });
      fs.writeFileSync(videoListPath, videoContent);

      const concatVideoPath = path.join(tempDir, 'concat_video.mp4');
      const concatVideoCmd = ffmpeg()
        .input(videoListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',
          '-crf 10',
          '-preset medium',
          '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-an' // No audio yet
        ])
        .output(concatVideoPath)
        .on('start', () => {
          eventSender.sender.send('renderize-progress', 5); // Início concatenação vídeo
        })
        .on('progress', (progress) => {
          const calculatedProgress = 5 + (progress.percent * 0.4); // 5% a 45% do total
          eventSender.sender.send('renderize-progress', calculatedProgress);
        })
        .on('end', () => {
          eventSender.sender.send('renderize-progress', 45); // Fim concatenação vídeo
        })
        .on('error', reject);
      currentFfmpegProcess = concatVideoCmd; // <--- ATRIBUI O PROCESSO ATUAL
      await new Promise((res, rej) => concatVideoCmd.on('end', res).on('error', rej).run());


      let finalAudioPath = null;
      if (audioSegments.length > 0) {
        finalAudioPath = path.join(tempDir, 'final_audio.wav');

        const audioCommand = ffmpeg();
        let filterComplex = '';
        let mixInputs = [];

        audioSegments.forEach((segment, index) => {
          audioCommand.input(segment.path);
          if (segment.position > 0) {
            filterComplex += `[<span class="math-inline">\{index\}\:a\]aformat\=sample\_fmts\=fltp\:sample\_rates\=44100\:channel\_layouts\=stereo,adelay\=</span>{Math.round(segment.position * 1000)}|<span class="math-inline">\{Math\.round\(segment\.position \* 1000\)\}\[a</span>{index}];`;
          } else {
            filterComplex += `[<span class="math-inline">\{index\}\:a\]aformat\=sample\_fmts\=fltp\:sample\_rates\=44100\:channel\_layouts\=stereo\[a</span>{index}];`;
          }
          mixInputs.push(`[a${index}]`);
        });

        if (mixInputs.length > 1) {
          filterComplex += `<span class="math-inline">\{mixInputs\.join\(''\)\}amix\=inputs\=</span>{mixInputs.length}:duration=longest[aout]`;
        } else {
          filterComplex += `${mixInputs[0]}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[aout]`;
        }

        const audioMixCmd = audioCommand
          .complexFilter(filterComplex, ['aout'])
          .outputOptions(['-map [aout]', '-c:a pcm_s16le'])
          .output(finalAudioPath)
          .on('start', () => {
            eventSender.sender.send('renderize-progress', 50); // Início processamento áudio
          })
          .on('progress', (progress) => {
            const calculatedProgress = 50 + (progress.percent * 0.2); // 50% a 70% do total
            eventSender.sender.send('renderize-progress', calculatedProgress);
          })
          .on('end', () => {
            eventSender.sender.send('renderize-progress', 70); // Fim processamento áudio
          })
          .on('error', (err) => {
            console.error('Error creating audio mix:', err);
            reject(err);
          });

        currentFfmpegProcess = audioMixCmd; // <--- ATRIBUI O PROCESSO ATUAL
        await new Promise((res, rej) => audioMixCmd.on('end', res).on('error', rej).run());
      } else {
        eventSender.sender.send('renderize-progress', 70); // Se não houver áudio, pula para 70%
      }

      // Final combination
      const finalCmd = ffmpeg()
        .input(concatVideoPath);

      if (finalAudioPath) {
        finalCmd.input(finalAudioPath);
      }

      finalCmd.outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-b:a 192k',
          '-shortest'
        ])
        .output(outputFilePath)
        .on('start', () => {
          eventSender.sender.send('renderize-progress', 75); // Início combinação final
        })
        .on('progress', (progress) => {
          const calculatedProgress = 75 + (progress.percent * 0.2); // 75% a 95% do total
          eventSender.sender.send('renderize-progress', calculatedProgress);
        })
        .on('end', () => {
          eventSender.sender.send('renderize-progress', 100); // Concluído
          console.log('Media rendered successfully!');

          // Clean up
          try {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true }); // Usar fs.rmSync para diretórios
            }
          } catch (cleanupErr) {
            console.warn('Error cleaning up temp directory:', cleanupErr);
          }
          currentFfmpegProcess = null; // <--- LIMPA O PROCESSO
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error creating final output:');
          console.error(err);
          console.error(`FFmpeg stderr: ${stderr}`);
          currentFfmpegProcess = null; // <--- LIMPA O PROCESSO EM CASO DE ERRO
          reject(err);
        });

      currentFfmpegProcess = finalCmd; // <--- ATRIBUI O PROCESSO ATUAL
      finalCmd.run();

    } catch (error) {
      console.error('Fatal error in renderizeVideo:', error);
      console.error('Error stack:', error.stack);
      currentFfmpegProcess = null; // <--- GARANTE QUE A REFERÊNCIA SEJA LIMPA EM CASO DE ERRO FATAL
      reject(new Error('Failed to render video: ' + (error.message || error)));
    }
  });
}


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

ipcMain.handle("cut-video", async (event, { filePath, startTime, duration }) => {
  const outputFilePath = path.join(app.getPath("userData"), "cut-video.mp4");

  try {
    // Passa o 'event' para a função para que ela possa enviar atualizações de progresso
    await cutVideo(filePath, startTime, duration, outputFilePath, event);
    const videoBase64 = await fileToBase64(outputFilePath);
    return videoBase64; // Retorna o vídeo cortado em base64 para o frontend
  } catch (error) {
    console.error("Error cutting video:", error);
    throw new Error("Error cutting video.");
  }
});

function cutVideo(filePath, startTime, duration, outputFilePath, eventSender) { // Adicionado eventSender
  return new Promise((resolve, reject) => {
    const command = ffmpeg(filePath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputFilePath)
      .outputOptions("-c:v libx264", "-crf 23", "-preset fast", "-c:a aac")
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
        currentFfmpegProcess = command; // <--- ATRIBUI O PROCESSO ATUAL
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
        if (eventSender) {
          eventSender.sender.send('renderize-progress', progress.percent); // <--- ENVIA O PROGRESSO
        }
      })
      .on("end", () => {
        console.log("Video cut successfully.");
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO
        resolve();
      })
      .on("error", (err) => {
        console.error("Error cutting video:", err);
        currentFfmpegProcess = null; // <--- LIMPA O PROCESSO EM CASO DE ERRO
        reject(err);
      });
    command.run();
  });
}

// NOVO: Handler para o evento de cancelamento
ipcMain.on('cancel-renderization', (event) => {
  if (currentFfmpegProcess) {
    console.log('Recebido comando de cancelamento. Tentando matar o processo FFmpeg...');
    try {
      currentFfmpegProcess.kill('SIGKILL'); // Use 'SIGKILL' para forçar o encerramento
      currentFfmpegProcess = null; // Limpa a referência após tentar matar
      console.log('Processo FFmpeg encerrado.');
      // Opcional: event.sender.send('renderization-canceled-ack');
    } catch (err) {
      console.error('Erro ao tentar matar o processo FFmpeg:', err);
    }
  } else {
    console.log('Nenhum processo FFmpeg ativo para cancelar.');
  }
});