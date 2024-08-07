document.addEventListener("DOMContentLoaded", function() {
  const video = document.getElementById("videoPlayer");
  const playPauseButton = document.getElementById("playPauseButton");
  const playPauseIcon = document.getElementById("playPauseIcon");
  const progressBar = document.getElementById("progressBar");
  const timeDisplay = document.getElementById("videoTime");

  function formatTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  playPauseButton.addEventListener("click", function() {
      if (video.paused) {
          video.play();
          playPauseIcon.src = "./imagens/pauseIcone.png"; // Caminho para o ícone de pause
      } else {
          video.pause();
          playPauseIcon.src = "./imagens/playIcone.png"; // Caminho para o ícone de play
      }
  });

  video.addEventListener("timeupdate", function() {
      const currentTime = video.currentTime;
      const duration = video.duration;

      timeDisplay.textContent = formatTime(currentTime);
      progressBar.value = (currentTime / duration);
  });

  video.addEventListener("loadedmetadata", function() {
      progressBar.max = video.duration;
  });

  progressBar.addEventListener("input", function() {
      video.currentTime = progressBar.value * video.duration;
  });
});
