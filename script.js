/* =======================
   GLOBAL STATE
======================= */
let gameState = {
    numPlayers: 0,
    maxRounds: null,
    players: [],
    avatars: [],
    totals: [],
    rounds: [],   // round-wise scores
    currentRound: 1
};

/* =======================
   STORAGE HELPERS
======================= */
function saveGame() {
    localStorage.setItem("currentGame", JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem("currentGame");
    if (saved) gameState = JSON.parse(saved);
}

function saveConfig(numPlayers, maxRounds) {
    localStorage.setItem("gameConfig", JSON.stringify({ numPlayers, maxRounds }));
}

function loadConfig() {
    return JSON.parse(localStorage.getItem("gameConfig"));
}

function saveMatchToHistory() {
    const history = JSON.parse(localStorage.getItem("matchHistory") || "[]");
    history.push({
        date: new Date().toLocaleString(),
        players: gameState.players,
        totals: gameState.totals,
        rounds: gameState.rounds
    });
    localStorage.setItem("matchHistory", JSON.stringify(history));
}

/* =======================
   SETUP PAGE
======================= */
function startGame() {
    const numPlayers = parseInt(document.getElementById("numPlayers").value);
    const rounds = document.getElementById("numRounds").value;
    const infinite = document.getElementById("infiniteRounds").checked;

    if (!numPlayers || numPlayers < 2) {
        alert("Minimum 2 players required");
        return;
    }

    saveConfig(numPlayers, infinite ? "infinite" : parseInt(rounds));
    localStorage.removeItem("currentGame"); // new match
    window.location.href = "game.html";
}

/* =======================
   GAME LOAD
======================= */
window.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("playerInputs")) return;

    const config = loadConfig();
    if (!config) return;

    loadGame();

    // If game already started → resume
    if (gameState.players.length > 0) {
        document.getElementById("nameSection").style.display = "none";
        document.getElementById("gameSection").style.display = "block";
        renderRoundHeader();
        renderRoundTable();
        renderTotals();
        loadRoundInputs();
        return;
    }

    gameState.numPlayers = config.numPlayers;
    gameState.maxRounds = config.maxRounds;

    const pi = document.getElementById("playerInputs");
    pi.innerHTML = "";

    for (let i = 0; i < gameState.numPlayers; i++) {
        pi.innerHTML += `
        <div class="col-md-6">
            <input class="form-control mb-2" id="p${i}" placeholder="Player ${i + 1} name">
            <input type="file" class="form-control" id="a${i}" accept="image/*">
        </div>`;
    }

    pi.innerHTML += `<button class="btn btn-primary mt-3" onclick="startRounds()">Start Match</button>`;
});

/* =======================
   START MATCH
======================= */
function startRounds() {
    for (let i = 0; i < gameState.numPlayers; i++) {
        gameState.players.push(
            document.getElementById(`p${i}`).value || `Player ${i + 1}`
        );
        gameState.totals.push(0);
        gameState.rounds = [];
        const file = document.getElementById(`a${i}`).files[0];
        gameState.avatars.push(file ? URL.createObjectURL(file) : "");
    }

    saveGame();

    document.getElementById("nameSection").style.display = "none";
    document.getElementById("gameSection").style.display = "block";

    renderRoundHeader();
    loadRoundInputs();
}

/* =======================
   ROUND UI
======================= */
function renderRoundHeader() {
    let head = "<tr><th>Round</th>";
    gameState.players.forEach(p => head += `<th>${p}</th>`);
    head += "</tr>";
    document.getElementById("roundHead").innerHTML = head;
}

function loadRoundInputs(prev = []) {
    document.getElementById("roundTitle").innerText =
        `Round ${gameState.currentRound}`;

    const si = document.getElementById("scoreInputs");
    si.innerHTML = "";

    gameState.players.forEach((p, i) => {
        si.innerHTML += `
        <div class="col-md-3 text-center">
            ${gameState.avatars[i] ? `<img src="${gameState.avatars[i]}" class="avatar">` : ""}
            <label>${p}</label>
            <input type="number" class="form-control" id="score${i}" value="${prev[i] || ""}">
        </div>`;
    });
}

/* =======================
   SUBMIT ROUND
======================= */
function submitRound() {
    let round = [];

    gameState.players.forEach((_, i) => {
        const val = parseInt(document.getElementById(`score${i}`).value) || 0;
        gameState.totals[i] += val;
        round.push(val);
    });

    gameState.rounds.push(round);
    gameState.currentRound++;

    saveGame();
    renderRoundTable();
    renderTotals();

    if (gameState.maxRounds !== "infinite" &&
        gameState.currentRound > gameState.maxRounds) {
        finishGame();
    } else {
        loadRoundInputs();
    }
}

/* =======================
   RENDER TABLES
======================= */
function renderRoundTable() {
    const body = document.getElementById("roundBody");
    body.innerHTML = "";

    gameState.rounds.forEach((r, idx) => {
        let row = `<tr><td>${idx + 1}</td>`;
        r.forEach(v => row += `<td>${v}</td>`);
        row += "</tr>";
        body.innerHTML += row;
    });
}

function renderTotals() {
    const tb = document.getElementById("totalBoard");
    tb.innerHTML = "";

    const ranked = [...gameState.totals]
        .map((t, i) => ({ t, i }))
        .sort((a, b) => a.t - b.t);

    ranked.forEach((r, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
        tb.innerHTML += `
        <tr>
            <td>${medal}</td>
            <td>${gameState.players[r.i]}</td>
            <td>${r.t}</td>
        </tr>`;
    });
}

/* =======================
   FINISH MATCH
======================= */
function finishGame() {
    const min = Math.min(...gameState.totals);
    const winners = gameState.players.filter((_, i) => gameState.totals[i] === min);

    document.getElementById("winnerText").innerText =
        winners.length > 1
            ? `Tie! Winners: ${winners.join(", ")} (${min})`
            : `Winner: ${winners[0]} (${min})`;

    saveMatchToHistory();
    localStorage.removeItem("currentGame");

    new bootstrap.Modal(document.getElementById("winnerModal")).show();
}

/* =======================
   HISTORY
======================= */
function openHistory() {
    const history = JSON.parse(localStorage.getItem("matchHistory") || "[]");
    const hc = document.getElementById("historyContent");

    hc.innerHTML = history.length === 0
        ? "<p>No matches yet.</p>"
        : history.map(m => `
            <div class="history-item">
                <strong>${m.date}</strong><br>
                ${m.players.map((p, i) => `${p}: ${m.totals[i]}`).join(" | ")}
            </div><hr>
        `).join("");

    new bootstrap.Modal(document.getElementById("historyModal")).show();
}
