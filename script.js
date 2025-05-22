
async function processImage() {
  const file = document.getElementById("imageUpload").files[0];
  const output = document.getElementById("output");
  if (!file) {
    alert("Bitte ein markiertes Bild auswählen.");
    return;
  }

  output.textContent = "🧠 Lese Bild…";

  const apiKey = prompt("🔐 GPT API-Key eingeben:");
  if (!apiKey) {
    output.textContent = "❌ Kein Key eingegeben.";
    return;
  }

  const { data: { text } } = await Tesseract.recognize(file, 'deu', { logger: m => console.log(m) });

  output.textContent = "🤖 Sende an GPT…";

  try {
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
            "Du bekommst Text aus einem Screenshot mit farblich markierten Feldern.
" +
            "Die Farben bedeuten:
" +
            "🔴 Rot: Objekt-Nr.
🟢 Grün: Kunden-Nr.
🟡 Gelb: Projektleiter
🔵 Blau: Objektadresse

" +
            "Bitte extrahiere die Daten anhand des Textes und liefere sie exakt in diesem Format:
" +
            "Objekt-Nr: ...
Kunden-Nr: ...
Projektleiter: ...
Objektadresse: ...

" +
            "Text aus Screenshot:

" + text
        }],
        temperature: 0.2
      })
    });

    const gptData = await gptRes.json();
    if (gptData.choices && gptData.choices.length > 0) {
      output.textContent = "✅ GPT-Ergebnis:

" + gptData.choices[0].message.content;
    } else {
      output.textContent = "❌ GPT-Antwort unklar.";
    }
  } catch (err) {
    output.textContent = "❌ Fehler bei GPT-Anfrage:
" + err.message;
  }
}
