const PUZZLE_FILE = "data/bulmacalar.json";

const puzzleNames = {
  kare: "🧩 Kare Bulmaca",
  sudoku: "🔢 Sudoku",
  kelime: "🔤 Kelime Avı",
  genel: "❓ Genel Kültür",
  zeka: "🧠 Zeka Sorusu"
};

const $ = (selector) => document.querySelector(selector);

function getLocalDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function showDate() {
  $("#today").textContent = new Date().toLocaleDateString("tr-TR", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

async function openPuzzle(type) {
  if (type !== "kare") {
    alert(`${puzzleNames[type]}\n\nBu bölüm sırayla hazırlanıyor. 🧩`);
    return;
  }

  try {
    const response = await fetch(PUZZLE_FILE, {cache:"no-store"});
    if (!response.ok) throw new Error("Bulmaca verisi yüklenemedi.");

    const all = await response.json();
    const puzzle = all[getLocalDateKey()]?.kare;

    if (!puzzle) {
      alert("Bugün için Kare Bulmaca bulunamadı.");
      return;
    }

    renderCrossword(puzzle);
  } catch (error) {
    console.error(error);
    alert("Bulmaca yüklenirken bir hata oluştu.");
  }
}

function buildOccupiedCells(puzzle) {
  const cells = new Map();

  for (const entry of puzzle.sorular.yatay.concat(puzzle.sorular.dikey)) {
    for (let i=0; i<entry.cevap.length; i++) {
      const row = entry.baslangic[0] + (entry.yon === "dikey" ? i : 0);
      const col = entry.baslangic[1] + (entry.yon === "yatay" ? i : 0);
      const key = `${row},${col}`;
      const letter = entry.cevap[i].toLocaleUpperCase("tr-TR");

      if (cells.has(key) && cells.get(key).letter !== letter) {
        throw new Error(`Bulmaca kesişiminde hata: ${key}`);
      }

      if (!cells.has(key)) cells.set(key, {row,col,letter});
    }
  }
  return cells;
}

function entryCells(entry) {
  return Array.from({length:entry.cevap.length}, (_,i) => ({
    row: entry.baslangic[0] + (entry.yon === "dikey" ? i : 0),
    col: entry.baslangic[1] + (entry.yon === "yatay" ? i : 0)
  }));
}

function renderCrossword(puzzle) {
  const occupied = buildOccupiedCells(puzzle);

  document.body.innerHTML = `
    <div class="crossword-page">
      <div class="crossword-wrap">
        <button class="back-button" id="backButton">← Geri</button>
        <h1 class="crossword-title">🧩 ${escapeHtml(puzzle.baslik)}</h1>
        <p class="crossword-subtitle">Soruyu okuyup boş kutulara harfleri yaz.</p>

        <div class="crossword-board-wrap">
          <div class="crossword-board" id="crosswordBoard"></div>
        </div>

        <div class="clues" id="clues"></div>
        <button class="check-button" id="checkButton">✅ Cevapları Kontrol Et</button>
        <div class="score" id="score"></div>
      </div>
    </div>
  `;

  const board = $("#crosswordBoard");

  for (let r=0; r<puzzle.boyut; r++) {
    for (let c=0; c<puzzle.boyut; c++) {
      const cell = document.createElement("div");
      cell.className = "crossword-cell black";
      cell.dataset.row = r;
      cell.dataset.col = c;

      const data = occupied.get(`${r},${c}`);

      if (data) {
        cell.classList.remove("black");

        const startingEntries = puzzle.sorular.yatay.concat(puzzle.sorular.dikey)
          .filter(e => e.baslangic[0] === r && e.baslangic[1] === c);

        if (startingEntries.length) {
          const n = document.createElement("span");
          n.className = "cell-number";
          n.textContent = Math.min(...startingEntries.map(e => e.numara));
          cell.appendChild(n);
        }

        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.inputMode = "text";
        input.dataset.row = r;
        input.dataset.col = c;

        input.addEventListener("focus", () => selectCell(r,c));
        input.addEventListener("click", () => selectCell(r,c));
        input.addEventListener("input", () => {
          input.value = input.value.toLocaleUpperCase("tr-TR").replace(/[^A-ZÇĞİÖŞÜ]/g,"");
          input.classList.remove("wrong","correct");
          selectCell(r,c);
          if (input.value) moveNext(r,c);
        });
        input.addEventListener("keydown", e => {
          if (e.key === "Backspace" && !input.value) {
            e.preventDefault();
            movePrev(r,c);
          }
        });

        cell.appendChild(input);
      }

      board.appendChild(cell);
    }
  }

  const clues = $("#clues");
  for (const [key,label] of [["yatay","YATAY"],["dikey","DİKEY"]]) {
    const h = document.createElement("h3");
    h.textContent = label;
    clues.appendChild(h);

    puzzle.sorular[key].forEach(entry => {
      const div = document.createElement("div");
      div.className = "clue";
      div.dataset.number = entry.numara;
      div.textContent = `${entry.numara}. ${entry.soru}`;
      div.addEventListener("click", () => focusEntry(entry));
      clues.appendChild(div);
    });
  }

  $("#backButton").onclick = () => location.reload();
  $("#checkButton").onclick = () => checkCrossword(puzzle);
}

function selectCell(row,col) {
  document.querySelectorAll(".crossword-cell").forEach(c => c.classList.remove("selected"));
  const cell = document.querySelector(`.crossword-cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) cell.classList.add("selected");
}

function moveNext(row,col) {
  const next = document.querySelector(`input[data-row="${row}"][data-col="${col+1}"]`);
  if (next) return next.focus();

  const down = document.querySelector(`input[data-row="${row+1}"][data-col="${col}"]`);
  if (down) down.focus();
}

function movePrev(row,col) {
  const prev = document.querySelector(`input[data-row="${row}"][data-col="${col-1}"]`);
  if (prev) return prev.focus();

  const up = document.querySelector(`input[data-row="${row-1}"][data-col="${col}"]`);
  if (up) up.focus();
}

function focusEntry(entry) {
  document.querySelectorAll(".clue").forEach(c => c.classList.remove("active"));
  const clue = document.querySelector(`.clue[data-number="${entry.numara}"]`);
  if (clue) clue.classList.add("active");

  const first = entryCells(entry)[0];
  const input = document.querySelector(`input[data-row="${first.row}"][data-col="${first.col}"]`);
  if (input) {
    input.focus();
    selectCell(first.row,first.col);
  }
}

function checkCrossword(puzzle) {
  const occupied = buildOccupiedCells(puzzle);
  let total = 0;
  let correct = 0;

  occupied.forEach(data => {
    const input = document.querySelector(`input[data-row="${data.row}"][data-col="${data.col}"]`);
    if (!input) return;

    total++;
    const actual = input.value.toLocaleUpperCase("tr-TR");
    input.classList.remove("correct","wrong");

    if (actual === data.letter) {
      input.classList.add("correct");
      correct++;
    } else {
      input.classList.add("wrong");
    }
  });

  const percent = total ? Math.round(correct/total*100) : 0;
  $("#score").textContent = percent === 100
    ? "🎉 Harika! Bulmacayı tamamladın."
    : `Sonuç: ${correct}/${total} doğru (${percent}%).`;
}

document.addEventListener("DOMContentLoaded", () => {
  if ($("#today")) showDate();
  document.querySelectorAll("[data-puzzle]").forEach(button => {
    button.addEventListener("click", () => openPuzzle(button.dataset.puzzle));
  });
});
