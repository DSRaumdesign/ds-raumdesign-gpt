
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

async function extractAndSendToGPT() {
  const fileInput = document.getElementById('pdfUpload');
  const output = document.getElementById('output');

  if (!fileInput.files.length) {
    alert('Bitte eine PDF auswählen.');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(',')[1];

    output.innerHTML = '⏳ Datei wird verarbeitet...';

    const apiKey = prompt("🔐 Bitte gib deinen OpenAI API-Key ein:");

    if (!apiKey) {
      output.innerHTML = "❌ Kein API-Key eingegeben.";
      return;
    }

    try {
      const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "user",
            content: "Extrahiere aus dem folgenden PDF-Inhalt (Base64-Text): Objekt-Nr., Kunden-Nr., Projektleiter und Objektadresse:\n\n" + base64
          }],
          temperature: 0.2
        })
      });

      const data = await gptResponse.json();
      if (data.choices && data.choices.length > 0) {
        output.innerHTML = "✅ Ergebnis:\n\n" + data.choices[0].message.content;
      } else {
        output.innerHTML = "❌ GPT-Antwort unklar.";
      }
    } catch (err) {
      output.innerHTML = "❌ Fehler:\n" + err.message;
    }
  };
  reader.readAsDataURL(file);
}
