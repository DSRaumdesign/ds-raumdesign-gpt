
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  if (user === 'Chef' && pass === '2710') {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  } else {
    alert('Falsche Zugangsdaten!');
  }
});

async function extractTextFromPDF() {
  const fileInput = document.getElementById('pdfUpload');
  const output = document.getElementById('output');
  if (!fileInput.files.length) {
    alert("Bitte eine PDF-Datei auswählen.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function () {
    const typedArray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const textContent = await page.getTextContent();
    let extracted = "";

    const pageHeight = viewport.height;
    const topThreshold = pageHeight * 0.75;

    for (const item of textContent.items) {
      const y = item.transform[5];
      if (y >= topThreshold) {
        extracted += item.str + " ";
      }
    }

    output.textContent = "⏳ GPT wird gefragt …";

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content: "Lies diesen Text aus dem oberen Teil der ersten PDF-Seite. Extrahiere folgende Felder falls vorhanden:
- Objekt-Nr.
- Kunden-Nr.
- Projektleiter
- Objektadresse

Antwortformat:
Objekt-Nr: ...
Kunden-Nr: ...
Projektleiter: ...
Objektadresse: ...

Text:
" + extracted
          }],
          temperature: 0.2
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        output.textContent = "✅ Ergebnis:

" + data.choices[0].message.content;
      } else {
        output.textContent = "❌ GPT-Antwort unklar.";
      }
    } catch (error) {
      output.textContent = "❌ Fehler bei GPT-Anfrage: " + error.message;
    }
  };

  reader.readAsArrayBuffer(file);
}
