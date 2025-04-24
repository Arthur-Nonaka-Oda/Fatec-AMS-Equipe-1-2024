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

ipcMain.handle('create-video-from-image', async (event, { filePath, duration }) => {
  const outputFilePath = path.join(app.getPath('userData'), `image-video-${Date.now()}.mp4`);

  try {
    await createVideoFromImage(filePath, duration, outputFilePath);
    const videoBase64 = await fileToBase64(outputFilePath);
    return videoBase64; // Retorna o vídeo em base64 para o frontend
  } catch (error) {
    console.error('Error creating video from image:', error);
    throw new Error('Error creating video from image.');
  }
});

function createVideoFromImage(imagePath, duration, outputFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(imagePath)
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
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log('Video created successfully.');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error creating video from image:', err);
        reject(err);
      })
      .run();
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


ipcMain.handle('renderize', async (event, { videos, audios }) => {
  const { filePath } = await dialog.showSaveDialog({
    title: "Save recording",
    defaultPath: `vid-${Date.now()}`,
  });

  if (filePath) {
    const outputFilePath = filePath.endsWith('.mp4') ? filePath : `${filePath}.mp4`;

    // Verifica se o diretório de saída existe
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      await renderizeVideo([...videos, ...audios], outputFilePath);
      return true;
    } catch (error) {
      console.error('Error during video rendering:', error.message || error);
      throw new Error('Failed to render video.');
    }
  } else {
    throw new Error('No file path selected');
  }
});


async function renderizeVideo(mediaItems, outputFilePath) {
  try {

    // Create a unique temp directory for this job
    const tempDir = path.join(require('os').tmpdir(), `media_render_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    console.log("Total media items to process:", mediaItems.length);

    // Helper functions to detect file types
    function isImageFile(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(ext);
    }

    function isAudioFile(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'].includes(ext);
    }

    // Step 1: Separate videos/images and audios
    const visuals = mediaItems.filter(item => !isAudioFile(item.filePath));
    const audios = mediaItems.filter(item => isAudioFile(item.filePath));

    console.log(`Processing ${visuals.length} visual items and ${audios.length} audio items`);

    // Step 2: Process all visual items into video segments
    const visualSegmentPromises = visuals.map((item, index) => {
      return new Promise((resolve, reject) => {
        const segmentPath = path.join(tempDir, `visual_segment_${index}.mp4`);

        if (isImageFile(item.filePath)) {
          // Handle image conversion to video segment
          const duration = item.endTime - item.startTime || 5;

          ffmpeg()
            .input(item.filePath)
            .inputOptions(['-loop 1'])
            .outputOptions([
              `-t ${duration}`,
              '-c:v libx264',
              '-pix_fmt yuv420p',
              '-r 30',
              '-an', // No audio
              '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
            ])
            .output(segmentPath)
            .on('start', () => {
              console.log(`Converting image to video segment: ${item.filePath}`);
            })
            .on('end', () => {
              console.log(`Created video from image: ${segmentPath}`);
              resolve({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: duration
              });
            })
            .on('error', (err) => {
              console.error(`Error converting image:`, err);
              reject(err);
            })
            .run();
        } else {
          // Handle video trimming
          ffmpeg(item.filePath)
            .setStartTime(item.startTime)
            .setDuration(item.endTime - item.startTime)
            .outputOptions([
              '-c:v libx264',
              '-an', // No audio
              '-avoid_negative_ts make_zero',
              '-reset_timestamps 1',
              '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
            ])
            .output(segmentPath)
            .on('start', () => {
              console.log(`Trimming video segment: ${item.filePath}`);
            })
            .on('end', () => {
              console.log(`Trimmed video segment: ${segmentPath}`);
              resolve({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: item.endTime - item.startTime
              });
            })
            .on('error', (err) => {
              console.error(`Error trimming video:`, err);
              reject(err);
            })
            .run();
        }
      });
    });

    // Step 3: Process all audio items - IMPROVED APPROACH
    const audioSegmentPromises = audios.map((item, index) => {
      return new Promise((resolve, reject) => {
        const segmentPath = path.join(tempDir, `audio_segment_${index}.wav`); // Use WAV for better compatibility

        console.log(`Processing audio segment from ${item.filePath}, start: ${item.startTime}, end: ${item.endTime}`);

        // Add more detailed error reporting
        const command = ffmpeg(item.filePath)
          .setStartTime(item.startTime)
          .setDuration(item.endTime - item.startTime)
          .outputOptions([
            '-c:a pcm_s16le', // Use uncompressed audio for intermediates
            '-ar 44100',      // Standard sample rate
            '-ac 2',          // Stereo
            '-vn'             // No video
          ])
          .output(segmentPath)
          .on('start', (commandLine) => {
            console.log(`Processing audio segment: ${item.filePath}`);
            console.log(`Command: ${commandLine}`);
          })
          .on('end', () => {
            console.log(`Processed audio segment: ${segmentPath}`);
            resolve({
              path: segmentPath,
              startTime: item.startTime,
              endTime: item.endTime,
              duration: item.endTime - item.startTime,
              position: item.startTime // Store position for timeline placement
            });
          })
          .on('error', (err, stdout, stderr) => {
            console.error(`Error processing audio:`);
            console.error(err);
            console.error(`FFmpeg stderr: ${stderr}`);
            reject(err);
          });

        command.run();
      });
    });

    // Step 4: Wait for all processing to complete
    return Promise.all([
      Promise.all(visualSegmentPromises),
      Promise.all(audioSegmentPromises)
    ]).then(([visualSegments, audioSegments]) => {
      // Sort segments by start time to maintain timeline order
      visualSegments.sort((a, b) => a.startTime - b.startTime);
      audioSegments.sort((a, b) => a.startTime - b.startTime);

      return new Promise((resolve, reject) => {
        console.log("All segments processed. Creating final video...");

        // Step 5: Create concat list for visual segments
        const videoListPath = path.join(tempDir, 'video_list.txt');
        let videoContent = '';
        visualSegments.forEach(segment => {
          videoContent += `file '${segment.path.replace(/'/g, "'\\''")}'` + '\n';
        });
        fs.writeFileSync(videoListPath, videoContent);

        // Step 6: Concatenate visual segments
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
          .output(concatVideoPath);

        concatVideoCmd.on('start', (cmdLine) => {
          console.log('Concatenating visual segments...');
          console.log(`Command: ${cmdLine}`);
        })
          .on('progress', (progress) => {
            console.log('Video concat: ' + (progress.percent || 0).toFixed(2) + '% done');
          })
          .on('end', () => {
            console.log('Visual segments concatenated.');

            // Step 7: Handle audio processing - IMPROVED APPROACH
            if (audioSegments.length > 0) {
              console.log("Processing audio segments...");

              // Create a silent audio base track with the same duration as the video
              const silentAudioPath = path.join(tempDir, 'silent_base.wav');
              const videoInfo = () => {
                return new Promise((resolveInfo, rejectInfo) => {
                  ffmpeg.ffprobe(concatVideoPath, (err, metadata) => {
                    if (err) {
                      console.error('Error getting video duration:', err);
                      rejectInfo(err);
                      return;
                    }
                    resolveInfo(metadata.format.duration);
                  });
                });
              };

              videoInfo().then((videoDuration) => {
                console.log(`Creating silent audio base track of ${videoDuration} seconds`);

                // Create silent audio base
                ffmpeg()
                  .input('anullsrc')
                  .inputOptions(['-f lavfi', `-t ${videoDuration}`])
                  .outputOptions([
                    '-c:a pcm_s16le',
                    '-ar 44100',
                    '-ac 2'
                  ])
                  .output(silentAudioPath)
                  .on('end', () => {
                    console.log('Silent base audio created');

                    // Now create the complex filter for audio
                    let filterComplex = '';
                    let inputLabels = [];

                    // Add silent base as first input
                    filterComplex += '[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[base];';

                    // Add each audio segment with its position
                    audioSegments.forEach((segment, index) => {
                      const inputIndex = index + 1; // Index in ffmpeg command (0 is silent base)
                      const inputLabel = `[${inputIndex}:a]`;
                      const outputLabel = `[a${inputIndex}]`;

                      filterComplex += `${inputLabel}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${Math.round(segment.position * 1000)}|${Math.round(segment.position * 1000)}${outputLabel};`;
                      inputLabels.push(outputLabel);
                    });

                    // Mix all audio segments with base
                    filterComplex += `[base]${inputLabels.join('')}amix=inputs=${inputLabels.length + 1}:duration=longest[aout]`;

                    console.log("Using filter complex:", filterComplex);

                    // Create final audio mix
                    const finalAudioPath = path.join(tempDir, 'final_audio.wav');
                    const audioCommand = ffmpeg();

                    // Add silent base as first input
                    audioCommand.input(silentAudioPath);

                    // Add all audio segments
                    audioSegments.forEach(segment => {
                      audioCommand.input(segment.path);
                    });

                    audioCommand
                      .complexFilter(filterComplex, ['aout'])
                      .outputOptions(['-map [aout]', '-c:a pcm_s16le'])
                      .output(finalAudioPath)
                      .on('start', (cmdLine) => {
                        console.log('Creating final audio mix...');
                        console.log(`Command: ${cmdLine}`);
                      })
                      .on('error', (err, stdout, stderr) => {
                        console.error('Error creating audio mix:');
                        console.error(err);
                        console.error(`FFmpeg stderr: ${stderr}`);
                        reject(err);
                      })
                      .on('end', () => {
                        console.log('Final audio mix created.');

                        // Combine video with final audio
                        ffmpeg()
                          .input(concatVideoPath)
                          .input(finalAudioPath)
                          .outputOptions([
                            '-c:v copy',
                            '-c:a aac',
                            '-b:a 192k',
                            '-shortest'
                          ])
                          .output(outputFilePath)
                          .on('start', (cmdLine) => {
                            console.log('Creating final output with audio...');
                            console.log(`Command: ${cmdLine}`);
                          })
                          .on('progress', (progress) => {
                            console.log('Final render: ' + (progress.percent || 0).toFixed(2) + '% done');
                          })
                          .on('error', (err, stdout, stderr) => {
                            console.error('Error creating final output:');
                            console.error(err);
                            console.error(`FFmpeg stderr: ${stderr}`);
                            reject(err);
                          })
                          .on('end', () => {
                            console.log('Media rendered successfully!');

                            // Clean up
                            try {
                              // Delete all temp files
                              visualSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                              audioSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                              fs.existsSync(videoListPath) && fs.unlinkSync(videoListPath);
                              fs.existsSync(concatVideoPath) && fs.unlinkSync(concatVideoPath);
                              fs.existsSync(silentAudioPath) && fs.unlinkSync(silentAudioPath);
                              fs.existsSync(finalAudioPath) && fs.unlinkSync(finalAudioPath);
                              fs.rmdirSync(tempDir, { recursive: true });
                            } catch (err) {
                              console.warn('Error cleaning up temp files:', err);
                            }

                            resolve();
                          })
                          .run();
                      })
                      .run();
                  })
                  .on('error', (err) => {
                    console.error('Error creating silent audio:', err);
                    reject(err);
                  })
                  .run();
              }).catch(err => {
                console.error('Error in video info processing:', err);
                reject(err);
              });
            } else {
              // No audio segments, just copy the video to final output
              ffmpeg()
                .input(concatVideoPath)
                .outputOptions(['-c:v copy'])
                .output(outputFilePath)
                .on('end', () => {
                  console.log('Media rendered successfully (video only)!');

                  // Clean up
                  try {
                    visualSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                    fs.existsSync(videoListPath) && fs.unlinkSync(videoListPath);
                    fs.existsSync(concatVideoPath) && fs.unlinkSync(concatVideoPath);
                    fs.rmdirSync(tempDir, { recursive: true });
                  } catch (err) {
                    console.warn('Error cleaning up temp files:', err);
                  }

                  resolve();
                })
                .on('error', (err) => {
                  console.error('Error creating final output:', err);
                  reject(err);
                })
                .run();
            }
          })
          .on('error', (err) => {
            console.error('Error concatenating visual segments:', err);
            reject(err);
          })
          .run();
      });
    })
      .catch(err => {
        console.error('Error processing media items:', err);
        // Clean up
        try {
          if (fs.existsSync(tempDir)) {
            fs.rmdirSync(tempDir, { recursive: true });
          }
        } catch (cleanupErr) {
          console.warn('Error cleaning up temp directory:', cleanupErr);
        }
        throw new Error('Failed to process media items: ' + (err.message || err));
      });
  } catch (error) {
    console.error('Fatal error in renderizeVideo:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to render video: ' + (error.message || error));
  }
} async function renderizeVideo(mediaItems, outputFilePath) {
  try {
    // Create a unique temp directory for this job
    const tempDir = path.join(require('os').tmpdir(), `media_render_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    console.log("Total media items to process:", mediaItems.length);

    // Helper functions to detect file types
    function isImageFile(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(ext);
    }

    function isAudioFile(filePath) {
      const ext = path.extname(filePath).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'].includes(ext);
    }

    // Step 1: Separate videos/images and audios
    const visuals = mediaItems.filter(item => !isAudioFile(item.filePath));
    const audios = mediaItems.filter(item => isAudioFile(item.filePath));

    console.log(`Processing ${visuals.length} visual items and ${audios.length} audio items`);

    // Step 2: Process all visual items into video segments
    const visualSegmentPromises = visuals.map((item, index) => {
      return new Promise((resolve, reject) => {
        const segmentPath = path.join(tempDir, `visual_segment_${index}.mp4`);

        if (isImageFile(item.filePath)) {
          // Handle image conversion to video segment
          const duration = item.endTime - item.startTime || 5;

          ffmpeg()
            .input(item.filePath)
            .inputOptions(['-loop 1'])
            .outputOptions([
              `-t ${duration}`,
              '-c:v libx264',
              '-pix_fmt yuv420p',
              '-r 30',
              '-an', // No audio
              '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
            ])
            .output(segmentPath)
            .on('start', () => {
              console.log(`Converting image to video segment: ${item.filePath}`);
            })
            .on('end', () => {
              console.log(`Created video from image: ${segmentPath}`);
              resolve({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: duration
              });
            })
            .on('error', (err) => {
              console.error(`Error converting image:`, err);
              reject(err);
            })
            .run();
        } else {
          // Handle video trimming
          ffmpeg(item.filePath)
            .setStartTime(item.startTime)
            .setDuration(item.endTime - item.startTime)
            .outputOptions([
              '-c:v libx264',
              '-an', // No audio
              '-avoid_negative_ts make_zero',
              '-reset_timestamps 1',
              '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2'
            ])
            .output(segmentPath)
            .on('start', () => {
              console.log(`Trimming video segment: ${item.filePath}`);
            })
            .on('end', () => {
              console.log(`Trimmed video segment: ${segmentPath}`);
              resolve({
                path: segmentPath,
                startTime: item.startTime,
                endTime: item.endTime,
                duration: item.endTime - item.startTime
              });
            })
            .on('error', (err) => {
              console.error(`Error trimming video:`, err);
              reject(err);
            })
            .run();
        }
      });
    });

    // Step 3: Process all audio items - IMPROVED APPROACH
    const audioSegmentPromises = audios.map((item, index) => {
      return new Promise((resolve, reject) => {
        const segmentPath = path.join(tempDir, `audio_segment_${index}.wav`); // Use WAV for better compatibility

        console.log(`Processing audio segment from ${item.filePath}, start: ${item.startTime}, end: ${item.endTime}`);

        // Add more detailed error reporting
        const command = ffmpeg(item.filePath)
          .setStartTime(item.startTime)
          .setDuration(item.endTime - item.startTime)
          .outputOptions([
            '-c:a pcm_s16le', // Use uncompressed audio for intermediates
            '-ar 44100',      // Standard sample rate
            '-ac 2',          // Stereo
            '-vn'             // No video
          ])
          .output(segmentPath)
          .on('start', (commandLine) => {
            console.log(`Processing audio segment: ${item.filePath}`);
            console.log(`Command: ${commandLine}`);
          })
          .on('end', () => {
            console.log(`Processed audio segment: ${segmentPath}`);
            resolve({
              path: segmentPath,
              startTime: item.startTime,
              endTime: item.endTime,
              duration: item.endTime - item.startTime,
              position: item.startTime // Store position for timeline placement
            });
          })
          .on('error', (err, stdout, stderr) => {
            console.error(`Error processing audio:`);
            console.error(err);
            console.error(`FFmpeg stderr: ${stderr}`);
            reject(err);
          });

        command.run();
      });
    });

    // Step 4: Wait for all processing to complete
    return Promise.all([
      Promise.all(visualSegmentPromises),
      Promise.all(audioSegmentPromises)
    ]).then(([visualSegments, audioSegments]) => {
      // Sort segments by start time to maintain timeline order
      visualSegments.sort((a, b) => a.startTime - b.startTime);
      audioSegments.sort((a, b) => a.startTime - b.startTime);

      return new Promise((resolve, reject) => {
        console.log("All segments processed. Creating final video...");

        // Step 5: Create concat list for visual segments
        const videoListPath = path.join(tempDir, 'video_list.txt');
        let videoContent = '';
        visualSegments.forEach(segment => {
          videoContent += `file '${segment.path.replace(/'/g, "'\\''")}'` + '\n';
        });
        fs.writeFileSync(videoListPath, videoContent);

        // Step 6: Concatenate visual segments
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
          .output(concatVideoPath);

        concatVideoCmd.on('start', (cmdLine) => {
          console.log('Concatenating visual segments...');
          console.log(`Command: ${cmdLine}`);
        })
          .on('progress', (progress) => {
            console.log('Video concat: ' + (progress.percent || 0).toFixed(2) + '% done');
          })
          .on('end', () => {
            console.log('Visual segments concatenated.');

            // Step 7: Handle audio processing - IMPROVED APPROACH WITH NO SILENT AUDIO REQUIREMENT
            if (audioSegments.length > 0) {
              console.log("Processing audio segments...");

              // Get video duration for reference
              const videoInfo = () => {
                return new Promise((resolveInfo, rejectInfo) => {
                  ffmpeg.ffprobe(concatVideoPath, (err, metadata) => {
                    if (err) {
                      console.error('Error getting video duration:', err);
                      rejectInfo(err);
                      return;
                    }
                    resolveInfo(metadata.format.duration);
                  });
                });
              };

              videoInfo().then((videoDuration) => {
                console.log(`Video duration: ${videoDuration} seconds`);

                // Create final audio mix without silent base
                const finalAudioPath = path.join(tempDir, 'final_audio.wav');

                // If there's only one audio segment, we can just copy it
                if (audioSegments.length === 1) {
                  const audioSegment = audioSegments[0];

                  // Handle positioning for single audio segment
                  if (audioSegment.position > 0) {
                    // Need to add silence before the audio
                    ffmpeg()
                      .input(audioSegment.path)
                      .audioFilters(`adelay=${Math.round(audioSegment.position * 1000)}|${Math.round(audioSegment.position * 1000)}`)
                      .outputOptions([
                        '-c:a pcm_s16le',
                        '-ar 44100',
                        '-ac 2'
                      ])
                      .output(finalAudioPath)
                      .on('end', () => {
                        console.log('Positioned single audio segment');
                        combineVideoAndAudio();
                      })
                      .on('error', (err) => {
                        console.error('Error positioning audio:', err);
                        reject(err);
                      })
                      .run();
                  } else {
                    // Just copy the audio as is
                    fs.copyFileSync(audioSegment.path, finalAudioPath);
                    console.log('Copied single audio segment as final audio');
                    combineVideoAndAudio();
                  }
                } else {
                  // For multiple audio segments, use filter_complex to position them correctly
                  const audioCommand = ffmpeg();

                  // Create filter complex for positioning audio segments
                  let filterComplex = '';
                  let mixInputs = [];

                  audioSegments.forEach((segment, index) => {
                    audioCommand.input(segment.path);

                    // Position audio with adelay filter
                    if (segment.position > 0) {
                      filterComplex += `[${index}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${Math.round(segment.position * 1000)}|${Math.round(segment.position * 1000)}[a${index}];`;
                    } else {
                      filterComplex += `[${index}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a${index}];`;
                    }

                    mixInputs.push(`[a${index}]`);
                  });

                  // Mix all audio segments
                  if (mixInputs.length > 1) {
                    filterComplex += `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest[aout]`;
                  } else {
                    filterComplex += `${mixInputs[0]}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[aout]`;
                  }

                  audioCommand
                    .complexFilter(filterComplex, ['aout'])
                    .outputOptions(['-map [aout]', '-c:a pcm_s16le'])
                    .output(finalAudioPath)
                    .on('start', (cmdLine) => {
                      console.log('Creating final audio mix...');
                      console.log(`Command: ${cmdLine}`);
                    })
                    .on('error', (err, stdout, stderr) => {
                      console.error('Error creating audio mix:');
                      console.error(err);
                      console.error(`FFmpeg stderr: ${stderr}`);
                      reject(err);
                    })
                    .on('end', () => {
                      console.log('Final audio mix created.');
                      combineVideoAndAudio();
                    })
                    .run();
                }

                // Helper function to combine video with audio
                function combineVideoAndAudio() {
                  ffmpeg()
                    .input(concatVideoPath)
                    .input(finalAudioPath)
                    .outputOptions([
                      '-c:v copy',
                      '-c:a aac',
                      '-b:a 192k',
                      '-shortest'
                    ])
                    .output(outputFilePath)
                    .on('start', (cmdLine) => {
                      console.log('Creating final output with audio...');
                      console.log(`Command: ${cmdLine}`);
                    })
                    .on('progress', (progress) => {
                      console.log('Final render: ' + (progress.percent || 0).toFixed(2) + '% done');
                    })
                    .on('error', (err, stdout, stderr) => {
                      console.error('Error creating final output:');
                      console.error(err);
                      console.error(`FFmpeg stderr: ${stderr}`);
                      reject(err);
                    })
                    .on('end', () => {
                      console.log('Media rendered successfully!');

                      // Clean up
                      try {
                        // Delete all temp files
                        visualSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                        audioSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                        fs.existsSync(videoListPath) && fs.unlinkSync(videoListPath);
                        fs.existsSync(concatVideoPath) && fs.unlinkSync(concatVideoPath);
                        fs.existsSync(finalAudioPath) && fs.unlinkSync(finalAudioPath);
                        fs.rmdirSync(tempDir, { recursive: true });
                      } catch (err) {
                        console.warn('Error cleaning up temp files:', err);
                      }

                      resolve();
                    })
                    .run();
                }

              }).catch(err => {
                console.error('Error in video info processing:', err);
                reject(err);
              });
            } else {
              // No audio segments, just copy the video to final output
              ffmpeg()
                .input(concatVideoPath)
                .outputOptions(['-c:v copy'])
                .output(outputFilePath)
                .on('end', () => {
                  console.log('Media rendered successfully (video only)!');

                  // Clean up
                  try {
                    visualSegments.forEach(segment => fs.existsSync(segment.path) && fs.unlinkSync(segment.path));
                    fs.existsSync(videoListPath) && fs.unlinkSync(videoListPath);
                    fs.existsSync(concatVideoPath) && fs.unlinkSync(concatVideoPath);
                    fs.rmdirSync(tempDir, { recursive: true });
                  } catch (err) {
                    console.warn('Error cleaning up temp files:', err);
                  }

                  resolve();
                })
                .on('error', (err) => {
                  console.error('Error creating final output:', err);
                  reject(err);
                })
                .run();
            }
          })
          .on('error', (err) => {
            console.error('Error concatenating visual segments:', err);
            reject(err);
          })
          .run();
      });
    })
      .catch(err => {
        console.error('Error processing media items:', err);
        // Clean up
        try {
          if (fs.existsSync(tempDir)) {
            fs.rmdirSync(tempDir, { recursive: true });
          }
        } catch (cleanupErr) {
          console.warn('Error cleaning up temp directory:', cleanupErr);
        }
        throw new Error('Failed to process media items: ' + (err.message || err));
      });
  } catch (error) {
    console.error('Fatal error in renderizeVideo:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to render video: ' + (error.message || error));
  }
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
