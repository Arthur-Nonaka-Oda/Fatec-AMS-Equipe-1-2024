document.addEventListener("DOMContentLoaded", function() {
    const video = document.getElementById("videoPlayer");
    const timeDisplay = document.getElementById("videoTime");

    video.addEventListener("timeupdate", function() {
        const currentTime = video.currentTime;
        const hours = Math.floor(currentTime / 3600);
        const minutes = Math.floor((currentTime % 3600) / 60);
        const seconds = Math.floor(currentTime % 60);

        const formattedTime = 
            String(hours).padStart(2, '0') + ":" + 
            String(minutes).padStart(2, '0') + ":" + 
            String(seconds).padStart(2, '0');
        
        timeDisplay.textContent = formattedTime;
    });
});
