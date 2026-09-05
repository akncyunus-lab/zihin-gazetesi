const FILE = "data/bulmacalar.json";
const $ = (s) => document.querySelector(s);

async function openPuzzle(type) {
  if (type !== "kare") {
    alert("Bu bölüm sırayla hazırlanıyor. 🧩");
    return;
  }

  try {
    const r = await fetch(FILE + "?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("JSON yüklenemedi");
    const d = await r.json();
    const p = d["2026-09-05"]?.kare;
    if (!p) throw new Error("Bulmaca bulunamadı");
    render(p);
  } catch (e) {
    console.error(e);
    alert("Bulmaca verisi yüklenemedi.");
  }
}

function buildCells(p) {
  const cells = new Map();
  const numbers = new Map();

  for (const direction of ["yatay", "dikey"]) {
    for (const clue of p.sorular[direction] || []) {
      const [startRow, startCol] = clue.baslangic;

      for (let i = 0; i < clue.cevap.length; i++) {
        const row = startRow + (direction === "dikey" ? i : 0);
        const col = startCol + (direction === "yatay" ? i : 0);
        const key = `${row},${col}`;
        const letter = clue.cevap[i].toLocaleUpperCase("tr-TR");

        if (cells.has(key) && cells.get(key) !== letter) {
          console.warn("Çakışan harf:", key, cells.get(key), letter);
        }
        cells.set(key, letter);

        if (!numbers.has(key)) numbers.set(key, clue.numara);
      }
    }
  }

  return { cells, numbers };
}

function render(p) {
  const { cells, numbers } = buildCells(p);

  document.body.innerHTML = `
    <div class="crossword-page">
      <div class="crossword-wrap">
        <button class="back-button" onclick="location.reload()">← Geri</button>
        <h1 class="crossword-title">🧩 ${p.baslik}</h1>
        <p class="crossword-subtitle">Soruları çöz, boş kutulara harfleri yaz.</p>

        <div class="crossword-board-wrap">
          <div class="crossword-board" id="board"></div>
        </div>

        <div class="clues" id="clues"></div>
        <button class="check-button" onclick="checkAnswers()">✅ Cevapları Kontrol Et</button>
        <div class="score" id="score"></div>
      </div>
    </div>
  `;

  const board = $("#board");
  const cellSize = window.innerWidth <= 480 ? 42 : 52;

  // CSS değişkenlerine güvenmek yerine grid ölçüsünü doğrudan veriyoruz.
  board.style.gridTemplateColumns = `repeat(${p.boyut}, ${cellSize}px)`;
  board.style.gridTemplateRows = `repeat(${p.boyut}, ${cellSize}px)`;
  board.style.width = `${p.boyut * cellSize + 2}px`;
  board.style.height = `${p.boyut * cellSize + 2}px`;

  for (let row = 0; row < p.boyut; row++) {
    for (let col = 0; col < p.boyut; col++) {
      const key = `${row},${col}`;
      const cell = document.createElement("div");
      cell.className = "crossword-cell black";

      const answer = cells.get(key);
      if (answer) {
        cell.classList.remove("black");

        if (numbers.has(key)) {
          const number = document.createElement("span");
          number.className = "cell-number";
          number.textContent = numbers.get(key);
          cell.appendChild(number);
        }

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.autocomplete = "off";
        input.inputMode = "text";
        input.dataset.answer = answer;

        input.addEventListener("input", () => {
          input.value = input.value.toLocaleUpperCase("tr-TR").slice(0, 1);
          input.classList.remove("correct", "wrong");
        });

        input.addEventListener("focus", () => {
          document.querySelectorAll(".crossword-cell").forEach((c) => c.classList.remove("selected"));
          cell.classList.add("selected");
        });

        cell.appendChild(input);
      }

      board.appendChild(cell);
    }
  }

  for (const [name, title] of [["yatay", "YATAY"], ["dikey", "DİKEY"]]) {
    const h = document.createElement("h3");
    h.textContent = title;
    $("#clues").appendChild(h);

    for (const clue of p.sorular[name] || []) {
      const q = document.createElement("div");
      q.className = "clue";
      q.textContent = `${clue.numara}. ${clue.soru}`;
      $("#clues").appendChild(q);
    }
  }
}

function checkAnswers() {
  let total = 0;
  let correct = 0;

  document.querySelectorAll("input[data-answer]").forEach((input) => {
    total++;
    input.classList.remove("correct", "wrong");

    const answer = input.value.toLocaleUpperCase("tr-TR");
    if (answer === input.dataset.answer) {
      input.classList.add("correct");
      correct++;
    } else if (answer) {
      input.classList.add("wrong");
    }
  });

  $("#score").textContent = `Sonuç: ${correct}/${total} doğru.`;
}

window.checkAnswers = checkAnswers;

// Ana sayfa

document.addEventListener("DOMContentLoaded", () => {
  const today = $("#today");
  if (today) {
    today.textContent = new Date().toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  document.querySelectorAll("[data-puzzle]").forEach((button) => {
    button.addEventListener("click", () => openPuzzle(button.dataset.puzzle));
  });
});
