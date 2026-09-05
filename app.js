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

function openPuzzle(type) {
const puzzleName = puzzleNames[type];

if (!puzzleName) {
alert("Bulmaca bulunamadı.");
return;
}

alert("${puzzleName}\n\nBu bölüm hazırlanıyor. 🧩");
}

showDate();