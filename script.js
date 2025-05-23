
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

async function processFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const status = document.getElementById("status");

  if (!file) {
    alert("Bitte eine Datei auswählen.");
    return;
  }

  status.textContent = "📥 Datei wird gelesen...";

  let imageBitmap;

  if (file.type === "application/pdf") {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.getElementById("pdfCanvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    imageBitmap = canvas;
  } else {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.getElementById("pdfCanvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        runOCR(canvas);
      };
    };
    reader.readAsDataURL(file);
    return;
  }

  runOCR(imageBitmap);
}

async function runOCR(canvas) {
  const status = document.getElementById("status");
  status.textContent = "🧠 OCR & Farberkennung läuft...";

  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const textResult = await Tesseract.recognize(canvas, 'deu');

  let A = "", B = "", C = "", D = "";

  if (textResult.data && textResult.data.words) {
    for (const word of textResult.data.words) {
      const x = Math.floor(word.bbox.x0);
      const y = Math.floor(word.bbox.y0);
      const i = (y * canvas.width + x) * 4;
      const [r, g, b] = [imageData.data[i], imageData.data[i+1], imageData.data[i+2]];

      const color = r > 200 && g < 100 && b < 100 ? 'red'
                  : r < 100 && g > 200 && b < 100 ? 'green'
                  : r > 200 && g > 200 && b < 100 ? 'yellow'
                  : r < 100 && g < 100 && b > 200 ? 'blue'
                  : null;

      if (color === 'red') A += word.text + " ";
      if (color === 'green') B += word.text + " ";
      if (color === 'yellow') C += word.text + " ";
      if (color === 'blue') D += word.text + " ";
    }
  }

  const wb = XLSX.utils.book_new();
  const ws_data = [
    ["Rechnung für DS Raumdesign"],
    [],
    ["Objekt-Nr", "Kunden-Nr", "Projektleiter", "Objektadresse"],
    [A.trim(), B.trim(), C.trim(), D.trim()]
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Rechnung");
  XLSX.writeFile(wb, "Rechnung_fertig.xlsx");

  status.textContent = "✅ Fertige Rechnung wurde erzeugt.";
}
