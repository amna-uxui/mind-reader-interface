const socket = io();

const roomCodeEl = document.getElementById("roomCode");
const dashboard = document.getElementById("dashboard");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const resetBtn = document.getElementById("resetBtn");

let currentRoomCode = "";

socket.emit("create-room");

socket.on("room-created", (roomCode) => {
  currentRoomCode = roomCode;
  roomCodeEl.textContent = roomCode;
});

copyLinkBtn.addEventListener("click", async () => {
  if (!currentRoomCode) return;

  const joinUrl = `${window.location.origin}/participant.html?room=${currentRoomCode}`;

  try {
    await navigator.clipboard.writeText(joinUrl);
    copyLinkBtn.textContent = "Copied";
    setTimeout(() => (copyLinkBtn.textContent = "Copy Join Link"), 1200);
  } catch {
    alert(joinUrl);
  }
});

resetBtn.addEventListener("click", () => {
  socket.emit("reset-room", { roomCode: currentRoomCode });
});

socket.on("dashboard-update", (participants) => {
  dashboard.innerHTML = "";

  if (!participants.length) {
    dashboard.innerHTML = `<p class="sub">Waiting for participants to join.</p>`;
    return;
  }

  const sortedParticipants = [...participants].sort(
    (a, b) => b.percentage - a.percentage
  );

  sortedParticipants.forEach((participant) => {
    const card = document.createElement("article");
    card.className = `card level-${participant.reactionLevel}`;

    card.innerHTML = `
      <div class="card-header">
        <span>${escapeHtml(participant.name)}</span>
        <strong>${participant.percentage}%</strong>
      </div>

      <div class="bar">
        <div class="bar-fill" style="width:${participant.percentage}%"></div>
      </div>

      <div class="stats-grid">
        <p><span>Speaking time</span>${participant.speakingSeconds}s</p>
        <p><span>Status</span>${participant.isSpeaking ? "SPEAKING" : "SILENT"}</p>
        <p><span>Reaction</span>LEVEL ${participant.reactionLevel}</p>
      </div>
    `;

    dashboard.appendChild(card);
  });
});

socket.on("room-closed", () => {
  alert("The room was closed.");
  window.location.href = "/";
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
