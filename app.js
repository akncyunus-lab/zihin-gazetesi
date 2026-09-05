const puzzleNames = {
  kare: "🧩 Kare Bulmaca",
  sudoku: "🔢 Sudoku",
  kelime: "🔤 Kelime Avı",
  genel: "❓ Genel Kültür",
  zeka: "🧠 Zeka Sorusu"
};

function showDate() {
  const today = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  };

  document.getElementById("today").textContent =
    today.toLocaleDateString("tr-TR", options);
}

async function openPuzzle(type) {

  if (type === "kare") {
    await openCrossword();
    return;
  }

  const puzzleName = puzzleNames[type];

  alert(`${puzzleName}\n\nBu bölüm hazırlanıyor. 🧩`);
}

async function openCrossword() {
  try {
    const response = await fetch("data/bulmacalar.json");

    if (!response.ok) {
      throw new Error("Bulmaca dosyası yüklenemedi.");
    }

    const data = await response.json();

    const today = new Date().toISOString().split("T")[0];

    const puzzle = data[today]?.kare;

    if (!puzzle) {
      alert("Bugün için Kare Bulmaca bulunamadı.");
      return;
    }

    showCrosswordScreen(puzzle);

  } catch (error) {
    console.error(error);
    alert("Bulmaca yüklenirken bir hata oluştu.");
  }
}

function showCrosswordScreen(puzzle) {

  const board = document.createElement("div");
  board.className = "crossword-board";

  puzzle.hucreler.forEach((row, rowIndex) => {

    row.forEach((cell, colIndex) => {

      const cellElement = document.createElement("div");

      if (cell === "#") {

        cellElement.className = "crossword-black";

      } else {

        cellElement.className = "crossword-cell";

        const input = document.createElement("input");

        input.maxLength = 1;
        input.dataset.row = rowIndex;
        input.dataset.col = colIndex;

        input.addEventListener("input", function () {

          this.value = this.value
            .toLocaleUpperCase("tr-TR")
            .replace(/[^A-ZÇĞİÖŞÜ]/g, "");

          moveToNextCell(rowIndex, colIndex);

        });

        cellElement.appendChild(input);
      }

      board.appendChild(cellElement);

    });

  });

  const container = document.createElement("div");

  container.className = "crossword-screen";

  container.innerHTML = `
    <button class="back-button" onclick="closeCrossword()">
      ← Geri
    </button>

    <h2>🧩 ${puzzle.baslik}</h2>

    <p class="crossword-info">
      Kutulara harfleri yaz. Bulmacayı tamamlamaya çalış!
    </p>
  `;

  container.appendChild(board);

  const questions = document.createElement("div");
  questions.className = "crossword-questions";

  questions.innerHTML = `
    <h3>YATAY</h3>
  `;

  puzzle.sorular.yatay.forEach(item => {

    questions.innerHTML += `
      <p>
        <strong>${item.numara}.</strong>
        ${item.soru}
      </p>
    `;

  });

  questions.innerHTML += `<h3>DİKEY</h3>`;

  puzzle.sorular.dikey.forEach(item => {

    questions.innerHTML += `
      <p>
        <strong>${item.numara}.</strong>
        ${item.soru}
      </p>
    `;

  });

  container.appendChild(questions);

  const checkButton = document.createElement("button");

  checkButton.className = "check-button";
  checkButton.textContent = "✅ Cevapları Kontrol Et";

  checkButton.onclick = function () {
    checkCrossword(puzzle);
  };

  container.appendChild(checkButton);

  document.body.innerHTML = "";
  document.body.appendChild(container);
}

function moveToNextCell(row, col) {

  const inputs = document.querySelectorAll(".crossword-cell input");

  for (const input of inputs) {

    const nextRow = Number(input.dataset.row);
    const nextCol = Number(input.dataset.col);

    if (
      nextRow === row &&
      nextCol > col
    ) {
      input.focus();
      return;
    }

  }
}

function checkCrossword(puzzle) {

  let correct = true;

  puzzle.hucreler.forEach((row, rowIndex) => {

    row.forEach((cell, colIndex) => {

      if (cell === "#") return;

      const input = document.querySelector(
        `input[data-row="${rowIndex}"][data-col="${colIndex}"]`
      );

      const answer = cell
        .toLocaleUpperCase("tr-TR");

      const userAnswer = input.value
        .toLocaleUpperCase("tr-TR");

      if (userAnswer === answer) {

        input.classList.add("correct");

      } else {

        input.classList.add("wrong");
        correct = false;

      }

    });

  });

  if (correct) {

    alert("🎉 Tebrikler! Bulmacayı doğru çözdün!");

  } else {

    alert("❌ Bazı harfler yanlış. Tekrar dene!");

  }
}

function closeCrossword() {
  location.reload();
}

showDate();