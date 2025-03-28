const { ipcRenderer } = require("electron");

function Importer() {
  this.imports = [];
  this.videos = [];

  this.importFile = async function () {
    const { filePath, name } = await ipcRenderer.invoke('import-dialog');
    if (filePath) {
      const blob = await this.videoToBlob(filePath);
      console.log(blob);
      if (!blob) {
        throw new Error('Failed to convert video to Blob.');
      }
      const blobUrl = URL.createObjectURL(blob);
      const duration = await getVideoDuration(blobUrl);
      const thumbnailUrl = await getVideoThumbnail(blobUrl);
      imports.push({ name: name, duration: duration, blob: blob, thumbnailUrl: thumbnailUrl });
      console.log(imports);
      const div = document.createElement("div");
      div.innerHTML = `<img src="${thumbnailUrl}" alt="${name}" width="200" height="100">`;
      div.innerHTML += `<p>${name}</p>`;
      div.innerHTML += `<p>${duration} S</p>`;
      // div.innerHTML += `<p>${size} Mb S</p>`;
      videoList.appendChild(div);
      // imports.forEach(x => {
      // });
    }
  }

  this.videoToBlob = async function (videoUrl) {
    try {
      console.log(`Fetching video from URL: ${videoUrl}`);
      const response = await fetch(videoUrl);
      console.log(`Fetch response:`, response);
      if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error fetching video:', error);
      throw new Error('Failed to fetch video.');
    }
  }

  this.getVideoDuration = function (blobUrl) {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');

      videoElement.onloadedmetadata = function () {
        resolve(videoElement.duration);
      };

      videoElement.onerror = function () {
        reject('Error loading video file.');
      };

      videoElement.src = blobUrl;
    });
  }

  this.getVideoThumbnail = async function (blobUrl) {
    return new Promise((resolve, reject) => {
      const videoElement = document.createElement('video');
      const canvasElement = document.createElement('canvas');
      const context = canvasElement.getContext('2d');

      videoElement.onloadeddata = function () {
        videoElement.currentTime = videoElement.duration / 2;
      };

      videoElement.onseeked = function () {
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const thumbnailUrl = canvasElement.toDataURL('image/png');
        resolve(thumbnailUrl);
      };

      videoElement.onerror = function () {
        reject('Error loading video file.');
      };

      videoElement.src = blobUrl;
    });
  }

}

module.exports = Importer;