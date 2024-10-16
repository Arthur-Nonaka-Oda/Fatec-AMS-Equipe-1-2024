const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

function Importer() {

  
  const videoList = document.getElementById('videoList');
  const imports = [];
  
  this.importFile = async function () {
    try {
      const { filePath, name } = await ipcRenderer.invoke('import-dialog');
      if (filePath) {
        const blob = await this.fileToBlob(filePath);
        if (!blob) {
          throw new Error('Failed to convert video to Blob.');
        }
        const blobUrl = URL.createObjectURL(blob);
        const duration = await this.getVideoDuration(blobUrl);
        const thumbnailUrl = await this.getVideoThumbnail(blobUrl);
        imports.push({ name: name, duration: duration, blob: blob, thumbnailUrl: thumbnailUrl });
        console.log(imports);
        const div = document.createElement("div");
        div.innerHTML = `<img src="${thumbnailUrl}" alt="${name}" width="200" height="100">`;
        div.innerHTML += `<p>${name}</p>`;
        div.innerHTML += `<p>${duration} S</p>`;
        videoList.appendChild(div);
      }
    } catch (error) {
      console.error('Error importing video:', error);
    }
  }

  this.importRecordedFiles = async function () {
    const videoDirectory = path.join(__dirname, "../videos"); // Replace with the actual path to your videos directory
    const importedVideos = [];

    fs.readdir(videoDirectory, async (err, files) => {
      if (err) {
      console.error('Error reading video directory:', err);
      return;
      }

      for (const file of files) {
      const filePath = path.join(videoDirectory, file);
      const blob = await this.fileToBlob(filePath);
      if (!blob) {
        console.error('Failed to convert video to Blob for file:', file);
        continue;
      }
      const blobUrl = URL.createObjectURL(blob);
      const duration = await this.getVideoDuration(blobUrl);
      const thumbnailUrl = await this.getVideoThumbnail(blobUrl);
      importedVideos.push({ name: file, duration: duration, blob: blob, thumbnailUrl: thumbnailUrl });
      }

      // console.log(importedVideos);
    });

    ipcRenderer.send('video-saved', {videos: importedVideos});
  }
  
  this.fileToBlob = function (filePath) {
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
  
  this.getVideoDuration = function (blobUrl) {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      videoElement.src = blobUrl;
      
      videoElement.onloadedmetadata = function () {
        resolve(videoElement.duration);
      };
      
      videoElement.onerror = function () {
        reject('Error loading video metadata.');
      };
    });
  }
  
  this.getVideoThumbnail = function (blobUrl) {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      videoElement.src = blobUrl;
      
      videoElement.onloadeddata = function () {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/jpeg');
      };
      
      videoElement.onerror = function () {
        reject('Error loading video data.');
      };
    });
  }
}

module.exports = Importer;