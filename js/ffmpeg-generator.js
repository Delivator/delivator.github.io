let args = '-c:v copy';

function setCookie(cname, cvalue, exdays) {
  let d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

function convertTime(time) {
  time = Math.floor(time);
  let h = Math.floor(time / 60 / 60);
  let m = Math.floor((time - h * 60 * 60) / 60);
  let s = time - (h * 60 * 60) - (m * 60);
  if (s < 10) s = "0" + s;
  if (h > 0) {
    return(`${h}:${m}:${s}`);
  } else {
    return(`${m}:${s}`);
  }
}

function getCookie(cname) {
  let name = cname + "=",
      decodedCookie = decodeURIComponent(document.cookie),
      ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  let url = window.URL || window.webkitURL,
      inputNode = document.querySelector("#fileInput"),
      videoPlayer = document.querySelector("#videoPlayer"),
      progressBar = document.querySelector("#progressBar"),
      pauseButton = document.querySelector("#playPause"),
      playerTime = document.querySelector("#playerTime"),
      muteButton = document.querySelector("#mute"),
      volumeSlider = document.querySelector("#volume"),
      startTime = document.querySelector("#startTime"),
      endTime = document.querySelector("#endTime"),
      startTimeBtn = document.querySelector("#startTime-btn"),
      endTimeBtn = document.querySelector("#endTime-btn"),
      markerStart = document.querySelector("#marker-start"),
      markerEnd = document.querySelector("#marker-end"),
      generateBtn = document.querySelector("#generate"),
      mainDiv = document.querySelector("#main"),
      modalOutput = document.querySelector("#modal-output"),
      output = document.querySelector("#output"),
      durationMultiplier,
      autoResume = false;

  function playSelectedFile(event) {
    let file = this.files[0],
        type = file.type,
        canPlay = videoPlayer.canPlayType(type);
    if (canPlay === "") canPlay = "no";
    if (canPlay === "no") {
      return;
    }
    let fileUrl = URL.createObjectURL(file);
    videoPlayer.src = fileUrl;
  }

  if (getCookie("volume") === "") {
    videoPlayer.volume = 0.5;
    volumeSlider.value = 50;
  } else {
    videoPlayer.volume = getCookie("volume");
    volumeSlider.value = Math.floor(getCookie("volume") * 100);
  }
  
  videoPlayer.onvolumechange = () => {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
      muteButton.className = "muted";
    } else {
      muteButton.className = "volume";
    }
    setCookie("volume", videoPlayer.volume, 356);
  };

  videoPlayer.oncanplay = () => {
    videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
  };

  videoPlayer.ondurationchange = () => {
    let duration = videoPlayer.duration;
    if (duration > 2000) {
      durationMultiplier = 1;
    } else if (duration > 1000) {
      durationMultiplier = 2;
    } else {
      durationMultiplier = 4;
    }
    progressBar.max = Math.floor(duration * durationMultiplier);
    playerTime.innerHTML = `0:00/${convertTime(duration)}`;
    startTime.max = duration;
    endTime.max = duration;
    endTime.value = duration;
    startTime.value = 0;
    startTimeEvent();
    endTimeEvent();
  };

  videoPlayer.ontimeupdate = () => {
    progressBar.value = Math.floor(videoPlayer.currentTime * durationMultiplier);
    playerTime.innerHTML = `${convertTime(videoPlayer.currentTime)}/${convertTime(videoPlayer.duration)}`;
    if (videoPlayer.currentTime > endTime.value) videoPlayer.currentTime = startTime.value;
    if (videoPlayer.currentTime < startTime.value) videoPlayer.currentTime = startTime.value;
  };

  inputNode.addEventListener("change", playSelectedFile, false);
  
  progressBar.addEventListener("input", event => {
    videoPlayer.currentTime = progressBar.value / durationMultiplier;
  });

  progressBar.addEventListener("mousedown", event => {
    if (!videoPlayer.paused) autoResume = true;
    videoPlayer.pause();
    videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
  });

  progressBar.addEventListener("mouseup", event => {
    if (autoResume) {
      autoResume = false;
      videoPlayer.play();
    }
    videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
  });

  pauseButton.addEventListener("click", event => {
    if (videoPlayer.readyState < 4) return;
    if (videoPlayer.paused) {
      videoPlayer.play();
      videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
    } else {
      videoPlayer.pause();
      videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
    }
  });

  muteButton.addEventListener("click", event => {
    videoPlayer.muted = !videoPlayer.muted;
  });

  volumeSlider.addEventListener("input", event => {
    videoPlayer.volume = volumeSlider.value / 100;
  });

  function startTimeEvent() {
    if (parseFloat(startTime.value) > startTime.max) startTime.value = startTime.max;
    videoPlayer.pause();
    videoPlayer.currentTime = startTime.value;
    if (parseFloat(startTime.value) > parseFloat(endTime.value)) endTime.value = startTime.value;
    endTime.min = startTime.value;
    let procent = startTime.value / videoPlayer.duration * 100;
    markerStart.style.left = `calc(${procent}% - 12px)`;
  }

  startTime.addEventListener("input", startTimeEvent);
  startTime.addEventListener("change", startTimeEvent);
  startTime.addEventListener("keyup", startTimeEvent);

  function endTimeEvent() {
    if (parseFloat(endTime.value) > endTime.max) endTime.value = endTime.max;
    videoPlayer.pause();
    videoPlayer.currentTime = endTime.value;
    if (parseFloat(startTime.value) > parseFloat(endTime.value)) endTime.value = startTime.value;
    let procent = endTime.value / videoPlayer.duration * 100;
    markerEnd.style.left = `calc(${procent}% - 12px)`;
  }

  endTime.addEventListener("input", endTimeEvent);
  endTime.addEventListener("change", endTimeEvent);
  endTime.addEventListener("keyup", endTimeEvent);

  startTimeBtn.addEventListener("click", event => {
    startTime.value = videoPlayer.currentTime;
    startTimeEvent();
  });

  endTimeBtn.addEventListener("click", event => {
    endTime.value = videoPlayer.currentTime;
    endTimeEvent();
  });

  generateBtn.addEventListener("click", event => {
    mainDiv.classList.toggle("blurred");
    modalOutput.classList.toggle("modal-toggled");
    let file = document.querySelector("#fileInput").value.split(/(\\|\/)/g).pop().split(".");
    const fileExt = file.pop();
    const fileName = file.join(".");
    const command = `ffmpeg -i "${fileName}.${fileExt}" -ss ${startTime.value} -t ${endTime.value - startTime.value} -vf ${args} "${fileName}_converted.${fileExt}"`;
    output.innerHTML = command;
  });

  modalOutput.addEventListener("click", event => {
    if (event.target !== modalOutput) return;
    mainDiv.classList.toggle("blurred");
    modalOutput.classList.toggle("modal-toggled");
  });
});
