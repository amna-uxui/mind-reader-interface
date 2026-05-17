const socket = io();

const joinScreen = document.getElementById("joinScreen");
const activeScreen = document.getElementById("activeScreen");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const takeover = document.getElementById("takeover");
const statusText = document.getElementById("statusText");
const percentageText = document.getElementById("percentageText");

let roomCode = "";
let audioContext;
let analyser;
let microphone;
let dataArray;
let signalInterval;
let hasAudioPermission = false;

const params = new URLSearchParams(window.location.search);
const roomFromUrl = params.get("room");
if (roomFromUrl) {
  roomInput.value = roomFromUrl.toUpperCase();
}

joinBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  roomCode = roomInput.value.trim().toUpperCase();

  if (!name || !roomCode) {
    alert("Enter your name and room code.");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = "Requesting microphone...";

  try {
    await startVoiceDetection();
    hasAudioPermission = true;
    socket.emit("join-room", { roomCode, name });
  } catch (error) {
    console.error(error);
    alert("Microphone permission failed. Use Chrome on Android if possible and allow microphone access.");
    joinBtn.disabled = false;
    joinBtn.textContent = "Join and Enable Microphone";
  }
});

socket.on("joined-room", () => {
  if (!hasAudioPermission) return;

  joinScreen.classList.add("hidden");
  activeScreen.classList.remove("hidden");

  signalInterval = setInterval(() => {
    const speaking = detectSpeaking();

    socket.emit("speaking-signal", {
      roomCode,
      isSpeaking: speaking
    });

    statusText.textContent = speaking ? "VOICE DETECTED" : "MONITORING";
  }, 1000);
});

socket.on("join-error", (message) => {
  alert(message);
  joinBtn.disabled = false;
  joinBtn.textContent = "Join and Enable Microphone";
});

socket.on("reaction", ({ level, percentage }) => {
  percentageText.textContent = `Dominance: ${percentage}%`;

  document.body.classList.remove("warning", "danger", "critical");
  takeover.classList.add("hidden");

  if (level === 1) {
    vibrate([150]);
  }

  if (level === 2) {
    document.body.classList.add("warning");
  }

  if (level === 3) {
    document.body.classList.add("danger");
    vibrate([300, 100, 300]);
    playTone();
  }

  if (level === 4) {
    document.body.classList.add("critical");
    takeover.classList.remove("hidden");
    vibrate([500, 100, 500, 100, 700]);
    playTone();
  }
});

socket.on("room-closed", () => {
  clearInterval(signalInterval);
  alert("The host closed the room.");
  window.location.href = "/";
});

async function startVoiceDetection() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Some mobile browsers need resume() after a user gesture.
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  analyser = audioContext.createAnalyser();
  microphone = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 512;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  microphone.connect(analyser);
}

function detectSpeaking() {
  if (!analyser || !dataArray) return false;

  analyser.getByteFrequencyData(dataArray);

  const average =
    dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

  // Classroom tuning note:
  // Raise this number if background noise causes false positives.
  // Lower it if soft speakers are not detected.
  return average > 18;
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.frequency.value = 440;
    oscillator.type = "sine";
    gain.gain.value = 0.05;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();

    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 300);
  } catch (error) {
    console.warn("Audio tone failed", error);
  }
}
