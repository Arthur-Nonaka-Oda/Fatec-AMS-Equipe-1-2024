document.addEventListener("DOMContentLoaded", function() {
    const video = document.getElementById("videoPlayer");
    const playPauseButton = document.getElementById("playPauseButton");
    const playPauseIcon = document.getElementById("playPauseIcon");
    const timeDisplay = document.getElementById("videoTime");

    let totalDuration = "00:00:00"; // Valor inicial padrão

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    playPauseButton.addEventListener("click", function() {
        if (video.paused) {
            video.play();
            playPauseIcon.classList.remove("bx-play");
            playPauseIcon.classList.add("bx-pause");
        } else {
            video.pause();
            playPauseIcon.classList.remove("bx-pause");
            playPauseIcon.classList.add("bx-play");
        }
    });

    video.addEventListener("timeupdate", function() {
        const currentTime = video.currentTime;
        timeDisplay.textContent = `${formatTime(currentTime)} / ${totalDuration}`;
    });

    video.addEventListener("loadedmetadata", function() {
        totalDuration = formatTime(video.duration);
        timeDisplay.textContent = `00:00:00 / ${totalDuration}`;
    });
});
