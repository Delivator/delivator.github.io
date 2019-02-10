const defaultSettings = {
  version: 1,
  volume: 0.5,
  commandPreset: 'ffmpeg -i "{{fileName}}.{{fileExtention}}" -ss {{startTime}} -t {{duration}} -c:v copy -c:a copy "{{fileName}}_trimmed.{{fileExtention}}"'
}

let settings = localStorage.getItem("settings");

function qs(querySelector) {
  return document.querySelector(querySelector);
}
function convertTime(time) {
  time = Math.floor(time);
  let h = Math.floor(time / 60 / 60);
  let m = Math.floor((time - h * 60 * 60) / 60);
  let s = time - (h * 60 * 60) - (m * 60);
  if (s < 10) s = "0" + s;
  if (h > 0) {
    return (`${h}:${m}:${s}`);
  } else {
    return (`${m}:${s}`);
  }
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}

function selectText(node) {
  if (document.body.createTextRange) {
      const range = document.body.createTextRange();
      range.moveToElementText(node);
      range.select();
  } else if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const inputNode = qs("#fileInput"),
    videoPlayer = qs("#videoPlayer"),
    progressBar = qs("#progressBar"),
    pauseButton = qs("#playPause"),
    playerTime = qs("#playerTime"),
    muteButton = qs("#mute"),
    volumeSlider = qs("#volume"),
    startTime = qs("#startTime"),
    endTime = qs("#endTime"),
    mainDiv = qs("#main"),
    modal = qs("#modal"),
    modalOutput = qs("#modal-output"),
    settingsModal = qs("#modal-settings"),
    commandPreset = qs("#commandPreset"),
    output = qs("#output");

  let durationMultiplier,
    autoResume = false,
    preventEvent = false;

  if (!settings) {
    settings = defaultSettings;
    saveSettings();
  } else {
    settings = JSON.parse(localStorage.getItem("settings"));
  }

  videoPlayer.volume = settings.volume;
  volumeSlider.value = Math.floor(settings.volume * 100);
  commandPreset.value = settings.commandPreset;
  commandPreset.placeholder = settings.commandPreset;

  function playSelectedFile() {
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

  videoPlayer.onvolumechange = () => {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
      muteButton.className = "muted";
    } else {
      muteButton.className = "volume";
    }
    volumeSlider.value = Math.floor(videoPlayer.volume * 100);
    preventEvent = true;
    settings.volume = videoPlayer.volume;
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
    if (!videoPlayer.paused && videoPlayer.currentTime > endTime.value) videoPlayer.currentTime = startTime.value;
    if (!videoPlayer.paused && videoPlayer.currentTime < startTime.value) videoPlayer.currentTime = startTime.value;
  };

  inputNode.addEventListener("change", playSelectedFile, false);

  progressBar.addEventListener("input", () => {
    videoPlayer.currentTime = progressBar.value / durationMultiplier;
  });

  progressBar.addEventListener("mousedown", () => {
    if (!videoPlayer.paused) autoResume = true;
    videoPlayer.pause();
    videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
  });

  progressBar.addEventListener("mouseup", () => {
    if (autoResume) {
      autoResume = false;
      videoPlayer.play();
    }
    videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
  });

  pauseButton.addEventListener("click", () => {
    if (videoPlayer.readyState < 4) return;
    if (videoPlayer.paused) {
      videoPlayer.play();
      videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
    } else {
      videoPlayer.pause();
      videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
    }
  });

  muteButton.addEventListener("click", () => {
    videoPlayer.muted = !videoPlayer.muted;
  });

  volumeSlider.addEventListener("input", event => {
    if (preventEvent) {
      preventEvent = false;
      return;
    }
    videoPlayer.volume = volumeSlider.value / 100;
  });

  function startTimeEvent() {
    if (parseFloat(startTime.value) > startTime.max) startTime.value = startTime.max;
    videoPlayer.pause();
    videoPlayer.currentTime = startTime.value;
    if (parseFloat(startTime.value) > parseFloat(endTime.value)) endTime.value = startTime.value;
    endTime.min = startTime.value;
    let procent = startTime.value / videoPlayer.duration * 100;
    qs("#marker-start").style.left = `calc(${procent}% - 12px)`;
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
    qs("#marker-end").style.left = `calc(${procent}% - 12px)`;
  }

  endTime.addEventListener("input", endTimeEvent);
  endTime.addEventListener("change", endTimeEvent);
  endTime.addEventListener("keyup", endTimeEvent);

  qs("#startTime-btn").addEventListener("click", () => {
    startTime.value = videoPlayer.currentTime;
    startTimeEvent();
  });

  qs("#endTime-btn").addEventListener("click", () => {
    endTime.value = videoPlayer.currentTime;
    endTimeEvent();
  });

  qs("#generate").addEventListener("click", () => {
    modalOutput.className = "";
    settingsModal.className = "hidden";
    mainDiv.classList.toggle("blurred");
    modal.classList.toggle("modal-toggled");
    let file = inputNode.value.split(/(\\|\/)/g).pop().split(".");
    const fileExt = file.pop();
    const fileName = file.join(".");
    const command = settings.commandPreset
      .replace(/{{fileName}}/g, fileName)
      .replace(/{{fileExtention}}/g, fileExt)
      .replace(/{{startTime}}/g, startTime.value)
      .replace(/{{duration}}/g, endTime.value - startTime.value);
    output.innerHTML = command;
  });

  modal.addEventListener("click", event => {
    if (event.target !== modal) return;
    mainDiv.classList.toggle("blurred");
    modal.classList.toggle("modal-toggled");
  });

  qs("#close").addEventListener("click", () => {
    mainDiv.classList.toggle("blurred");
    modal.classList.toggle("modal-toggled");
  });

  qs("#settings").addEventListener("click", () => {
    modalOutput.className = "hidden";
    settingsModal.className = "";
    mainDiv.classList.toggle("blurred");
    modal.classList.toggle("modal-toggled");
  });

  document.addEventListener("keypress", (event) => {
    if (event.keyCode === 32) { // space
      if (videoPlayer.paused) {
        videoPlayer.play();
        videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
      } else {
        videoPlayer.pause();
        videoPlayer.paused ? pauseButton.className = "play" : pauseButton.className = "pause";
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.keyCode === 37) { // left
      if (!videoPlayer.paused) videoPlayer.pause();
      videoPlayer.currentTime -= 0.01;
    }
    if (event.keyCode === 39) { // right
      if (!videoPlayer.paused) videoPlayer.pause();
      videoPlayer.currentTime += 0.01;
    }
    if (event.keyCode === 38) { // up
      if (videoPlayer.volume + 0.01 > 1) {
        videoPlayer.volume = 1;
      } else {
        videoPlayer.volume += 0.01;
      }
    }
    if (event.keyCode === 40) { // down
      if (videoPlayer.volume - 0.01 < 0) {
        videoPlayer.volume = 0;
      } else {
        videoPlayer.volume -= 0.01;
      }
    }
  });

  window.addEventListener("beforeunload", () => {
    saveSettings();
  });

  commandPreset.addEventListener("input", () => {
    settings.commandPreset = commandPreset.value;
  })

  qs("#resetSettings").addEventListener("click", () => {
    commandPreset.value = defaultSettings.commandPreset;
  });

  output.addEventListener("click", () => {
    selectText(output);
  });
});
