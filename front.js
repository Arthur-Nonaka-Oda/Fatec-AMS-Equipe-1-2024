document.addEventListener("DOMContentLoaded", function() {
    const video = document.getElementById("videoPlayer");
    const playPauseButton = document.getElementById("playPauseButton");
    const volumeSlider = document.getElementById("volumeSlider");
    const progressBar = document.getElementById("progressBar");
    const timeDisplay = document.getElementById("videoTime");
  
    playPauseButton.addEventListener("click", function() {
      if (video.paused) {
        video.play();
        playPauseButton.textContent = "Pausar";
      } else {
        video.pause();
        playPauseButton.textContent = "Reproduzir";
      }
    });
  
    volumeSlider.addEventListener("input", function() {
      video.volume = volumeSlider.value;
    });
  
    video.addEventListener("timeupdate", function() {
      const currentTime = video.currentTime;
      const duration = video.duration;
  
      const formattedTime = formatTime(currentTime, duration);
      timeDisplay.textContent = formattedTime;
  
      const progress = currentTime / duration;
      progressBar.value = progress;
    });
  
    video.addEventListener("loadedmetadata", function() {
      progressBar.max = video.duration;
    });
  });
  
  function formatTime(currentTime, duration) {
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = Math.floor(currentTime % 60);
  
    const formattedTime =
      String(hours).padStart(2, "0") + ":" +
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");
  
    return formattedTime;
  }


