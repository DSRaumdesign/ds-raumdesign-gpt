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
              "Du erhältst Text aus dem oberen Bereich der ersten Seite eines Bauleistungsverzeichnisses.\n" +
              "Bitte extrahiere folgende Felder:\n\n" +
              "- Objekt-Nr: (nach 'Objekt-Nr:')\n" +
              "- Kunden-Nr: (nach 'Kunden-Nr:')\n" +
              "- Projektleiter: (nach 'Objekt-Leiter:')\n" +
              "- Objektadresse: (nach dem Wort 'Objekt:')\n\n" +
              "Text:\n\n" + extracted
          }],
          temperature: 0.2
        })
      });

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        output.textContent = "✅ Ergebnis:\n\n" + data.choices[0].message.content;
      } else {
        output.textContent = "❌ GPT-Antwort unklar.";
      }
    } catch (error) {
      output.textContent = "❌ Fehler bei GPT-Anfrage: " + error.message;
    }
  };

  reader.readAsArrayBuffer(file);
}
