
function checkLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "Chef" && pass === "2710") {
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
  } else {
    alert("❌ Falsche Zugangsdaten");
  }
}

async function generateExcelFromOCR() {
  const status = document.getElementById("status");
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Bitte ein Bild hochladen.");
    return;
  }

  status.textContent = "🧠 Lese Text mit OCR...";

  const { data: { text } } = await Tesseract.recognize(file, 'deu', {
    logger: m => console.log(m)
  });

  status.textContent = "📊 Erstelle Excel...";

  const wb = XLSX.utils.book_new();
  const ws_data = [
    ["Rechnung für DS Raumdesign"],
    [],
    ["Objekt-Nr", "Kunden-Nr", "Projektleiter", "Objektadresse"],
    ["{{A}}", "{{B}}", "{{C}}", "{{D}}"],
    [],
    ["Erkannter Text (OCR):"],
    [text]
  ];

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Rechnung");
  XLSX.writeFile(wb, "Rechnung_fertig_ocr.xlsx");

  status.textContent = "✅ Rechnung erstellt als Excel mit OCR-Text. Bitte manuell zuordnen.";
}
