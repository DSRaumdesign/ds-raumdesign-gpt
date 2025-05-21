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

  const apiKey = prompt("🔐 Bitte gib deinen OpenAI API-Key ein:");
  if (!apiKey) {
    output.textContent = "❌ Kein API-Key eingegeben.";
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
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content:
              "Du erhältst Text aus dem oberen Bereich der ersten Seite eines Bauleistungsverzeichnisses.
" +
              "Bitte extrahiere folgende Felder, auch wenn du dir nicht ganz sicher bist:

" +
              "- Objekt-Nr: Eine 5-stellige Zahl rechts unten nach 'Objekt-Nr:'
" +
              "- Kunden-Nr: Steht direkt unter Objekt-Nr, nach 'Kunden-Nr:'
" +
              "- Projektleiter: Nach dem Text 'Objekt-Leiter:' mit Vor- und Nachname
" +
              "- Objektadresse: Der Text direkt hinter dem Wort 'Objekt:' – meist Straße, PLZ Ort.

" +
              "Beispiel-Ausgabe:
" +
              "Objekt-Nr: 53490
" +
              "Kunden-Nr: 81916
" +
              "Projektleiter: Edvin Dolicanin
" +
              "Objektadresse: Berkersheimer Weg 107, 60433 Frankfurt am Main

" +
              "Hier ist der PDF-Text:

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
