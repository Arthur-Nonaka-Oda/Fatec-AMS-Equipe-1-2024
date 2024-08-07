
let imports = [];
let videos = [];


const videoElement = document.getElementById("videoElement");
// const mediaSource = new MediaSource();



async function videoToBlob(videoUrl) {
  const response = await fetch(videoUrl);
  const blob = await response.blob();
  return blob;
}

function getVideoDuration(blobUrl) {
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

async function getVideoThumbnail(blobUrl) {
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

const videoList = document.getElementById("videos");

const importButton = document.getElementById("importButton");
importButton.addEventListener("click", async () => {
  const { filePath, name} = await window.electron.importDialog();
  if (filePath) {
    const blob = await videoToBlob(filePath);
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
});