let numPlayers, maxRounds;
let playerNames = [], totals = [], history = [], avatars = [];
let currentRound = 1;

// ---------- Start Game ----------
function startGame(){
    numPlayers = parseInt(document.getElementById('numPlayers').value);
    const rounds = document.getElementById('numRounds').value;
    const infinite = document.getElementById('infiniteRounds').checked;

    localStorage.setItem("numPlayers", numPlayers);
    localStorage.setItem("numRounds", infinite ? "infinite" : rounds);
    window.location.href = "game.html";
}

// ---------- On Load ----------
window.onload = () => {
    numPlayers = parseInt(localStorage.getItem("numPlayers"));
    maxRounds = localStorage.getItem("numRounds");
    if(!numPlayers) return;

    const pi = document.getElementById("playerInputs");

    for(let i=0;i<numPlayers;i++){
        pi.innerHTML += `
        <div class="col-md-6 text-center">
            <input class="form-control mb-2" id="p${i}" placeholder="Player ${i+1} name">
            <input type="file" class="form-control" id="a${i}" accept="image/*">
        </div>`;
    }

    pi.innerHTML += `<button class="btn btn-primary mt-3" onclick="startRounds()">Start Game</button>`;
};

// ---------- Start Rounds ----------
function startRounds(){
    for(let i=0;i<numPlayers;i++){
        playerNames.push(document.getElementById(`p${i}`).value || `Player ${i+1}`);
        totals.push(0);
        const file = document.getElementById(`a${i}`).files[0];
        avatars.push(file ? URL.createObjectURL(file) : "");
    }

    document.getElementById("nameSection").style.display = "none";
    document.getElementById("gameSection").style.display = "block";

    createRoundHeader();
    loadRound();
}

// ---------- Round UI ----------
function createRoundHeader(){
    let head = "<tr><th>Round</th>";
    playerNames.forEach(n => head += `<th>${n}</th>`);
    head += "</tr>";
    document.getElementById("roundHead").innerHTML = head;
}

function loadRound(prev=[]){
    document.getElementById("roundTitle").innerText = `Round ${currentRound}`;
    const si = document.getElementById("scoreInputs");
    si.innerHTML = "";

    playerNames.forEach((n,i)=>{
        si.innerHTML += `
        <div class="col-md-3 text-center">
            ${avatars[i] ? `<img src="${avatars[i]}" class="avatar">` : ``}
            <label>${n}</label>
            <input type="number" id="score${i}" class="form-control" value="${prev[i] || ''}">
        </div>`;
    });
}

// ---------- Submit Round ----------
function submitRound(){
    document.getElementById("clickSound").play();

    let row = `<tr><td>${currentRound}</td>`;
    let roundScores = [];

    playerNames.forEach((_,i)=>{
        const v = parseInt(document.getElementById(`score${i}`).value) || 0;
        totals[i] += v;
        roundScores.push(v);
        row += `<td>${v}</td>`;
    });

    document.getElementById("roundBody").innerHTML += row + "</tr>";
    history.push(roundScores);

    updateTotals();
    currentRound++;

    if(maxRounds !== "infinite" && currentRound > maxRounds){
        finishGame();
    } else {
        loadRound();
    }
}

// ---------- Edit Previous ----------
function editPrevious(){
    if(history.length === 0) return;

    currentRound--;
    const last = history.pop();
    const body = document.getElementById("roundBody");
    body.removeChild(body.lastChild);

    last.forEach((v,i)=> totals[i] -= v);
    updateTotals();
    loadRound(last);
}

// ---------- Update Totals with Medals ----------
function updateTotals(){
    const tb = document.getElementById("totalBoard");
    tb.innerHTML = "";

    let ranked = [...totals].map((t,i)=>({t,i}))
        .sort((a,b)=>a.t-b.t);

    ranked.forEach((r,idx)=>{
        let medal = idx===0?"🥇":idx===1?"🥈":idx===2?"🥉":"";
        tb.innerHTML += `
        <tr>
            <td>${medal}</td>
            <td>${avatars[r.i]?`<img src="${avatars[r.i]}" class="avatar-sm">`:''} ${playerNames[r.i]}</td>
            <td>${r.t}</td>
        </tr>`;
    });
}

// ---------- Finish Game ----------
function finishGame(){
    document.getElementById("winSound").play();

    let min = Math.min(...totals);
    let winners = playerNames.filter((_,i)=>totals[i]===min);

    document.getElementById("winnerText").innerText =
        winners.length>1
        ? `Tie! Winners: ${winners.join(", ")} (${min})`
        : `Winner: ${winners[0]} (${min})`;

    saveMatch();
    const modal = new bootstrap.Modal(document.getElementById('winnerModal'));
    modal.show();
}

// ---------- Save Match ----------
function saveMatch(){
    const matches = JSON.parse(localStorage.getItem("matches") || "[]");
    matches.push({
        date: new Date().toLocaleString(),
        players: playerNames,
        totals: totals
    });
    localStorage.setItem("matches", JSON.stringify(matches));
}

// ✅ FIXED HISTORY ----------
function openHistory(){
    const matches = JSON.parse(localStorage.getItem("matches") || "[]");
    const content = document.getElementById("historyContent");

    if(matches.length === 0){
        content.innerHTML = "<p>No matches played yet.</p>";
    } else {
        content.innerHTML = matches.map(m => `
            <div class="history-item">
                <strong>${m.date}</strong><br>
                ${m.players.map((p,i)=>`${p}: ${m.totals[i]}`).join(" | ")}
            </div><hr>
        `).join("");
    }

    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
}

// ---------- Theme ----------
function toggleTheme(){
    document.body.classList.toggle("dark-mode");
}

// ---------- Export ----------
function exportCSV(){
    let csv="Player,Total\n";
    playerNames.forEach((p,i)=>csv+=`${p},${totals[i]}\n`);
    const blob=new Blob([csv]);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="scores.csv";
    a.click();
}

function exportPDF(){
    window.print();
}

// ---------- THEME SYSTEM ----------
function toggleTheme(){
    const body = document.body;
    const btn = document.getElementById("themeBtn");

    body.classList.toggle("dark");

    if(body.classList.contains("dark")){
        btn.innerText = "☀️ Light";
        localStorage.setItem("theme","dark");
    }else{
        btn.innerText = "🌙 Dark";
        localStorage.setItem("theme","light");
    }
}

window.addEventListener("DOMContentLoaded", ()=>{
    const saved = localStorage.getItem("theme");
    const btn = document.getElementById("themeBtn");

    if(saved === "dark"){
        document.body.classList.add("dark");
        if(btn) btn.innerText = "☀️ Light";
    }
});

