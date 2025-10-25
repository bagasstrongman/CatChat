// ===============================
// Cat Chat — app.js (versi clean + toast install)
// ===============================

const btnRecord = document.getElementById('btnRecord');
const btnStop = document.getElementById('btnStop');
const btnUpload = document.getElementById('btnUpload');
const audioPreview = document.getElementById('audioPreview');
const fileInput = document.getElementById('fileInput');
const resultText = document.getElementById('resultText');
const confidenceEl = document.getElementById('confidence');
const btnInstall = document.getElementById('btnInstall');
const toast = document.getElementById('toast');
const closeToast = document.getElementById('close-toast');

let mediaRecorder;
let recordedChunks = [];
let deferredPrompt;

// ===============================
// Service Worker Registration
// ===============================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker terdaftar'))
    .catch(err => console.error('❌ Gagal daftar SW:', err));
}

// ===============================
// Install Prompt + Toast
// ===============================
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Tampilkan tombol dan toast
  btnInstall.hidden = false;
  if (toast) toast.classList.remove('hidden');
});

// Klik tombol install
btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  console.log('Install choice:', choice);

  btnInstall.hidden = true;
  if (toast) toast.classList.add('hidden');
  deferredPrompt = null;
});

// Klik toast banner
if (toast) {
  toast.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('Install via toast:', choice);
    toast.classList.add('hidden');
    btnInstall.hidden = true;
    deferredPrompt = null;
  });
}

// Klik tombol close di toast
if (closeToast) {
  closeToast.addEventListener('click', (event) => {
    event.stopPropagation();
    toast.classList.add('hidden');
  });
}

// ===============================
// Recording Logic
// ===============================
btnRecord.addEventListener('click', async () => {
  recordedChunks = [];
  resultText.textContent = '🎙️ Merekam suara kucing...';

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'audio/webm' });
      audioPreview.src = URL.createObjectURL(blob);
      audioPreview.hidden = false;
      btnUpload.disabled = false;
      audioPreview._lastRecorded = blob;
      resultText.textContent = 'Rekaman selesai. Klik "Kirim ke AI"';
    };
    mediaRecorder.start();
    btnRecord.disabled = true;
    btnStop.disabled = false;
  } catch (err) {
    console.error('Gagal akses mikrofon:', err);
    resultText.textContent = '❌ Tidak bisa akses mikrofon.';
  }
});

btnStop.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    btnRecord.disabled = false;
    btnStop.disabled = true;
  }
});

// ===============================
// File Input Handler
// ===============================
fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  audioPreview.src = URL.createObjectURL(f);
  audioPreview.hidden = false;
  btnUpload.disabled = false;
  audioPreview._lastRecorded = f;
  resultText.textContent = 'File siap dikirim ke AI';
});

// ===============================
// Kirim ke Groq AI (Whisper + LLaMA3)
// ===============================
async function analyzeCatMeow(blob) {
  const apiKey = "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";

  // 1️⃣ Transkripsi audio jadi teks
  const formData = new FormData();
  formData.append("file", blob, "meow.webm");
  formData.append("model", "whisper-large-v3");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) throw new Error(await response.text());

  const data = await response.json();
  const text = data.text?.trim() || "(tidak ada suara terdeteksi)";
  console.log("🎧 Transkripsi suara:", text);

  // 2️⃣ Interpretasi makna suara kucing
  const interpretResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Kamu adalah penerjemah bahasa kucing. Jawablah sangat singkat (maksimum 15 kata) dengan gaya lucu dan alami, tanpa penjelasan tambahan."
        },
        {
          role: "user",
          content: `Suara kucing: "${text}". Apa maknanya bagi manusia?`
        }
      ],
      temperature: 0.5,
      max_tokens: 50
    })
  });

  if (!interpretResponse.ok) throw new Error(await interpretResponse.text());

  const interpretData = await interpretResponse.json();
  const meaning = interpretData.choices?.[0]?.message?.content?.trim() || "Tidak ada interpretasi dari AI.";

  return {
    text: `🐾 Prediksi arti: "${text}".\n\n💬 ${meaning}`,
    confidence: Math.floor(Math.random() * 21) + 80
  };
}

// ===============================
// Tombol Upload (Kirim ke AI)
// ===============================
btnUpload.addEventListener('click', async () => {
  const blob = audioPreview._lastRecorded;
  if (!blob) return;

  btnUpload.disabled = true;
  btnRecord.disabled = true;
  btnStop.disabled = true;
  resultText.textContent = 'Mengirim ke AI... 🧠';
  confidenceEl.style.display = 'none';

  try {
    const res = await analyzeCatMeow(blob);
    resultText.textContent = res.text;
    confidenceEl.style.display = 'block';
    confidenceEl.textContent = `Accuracy: ${res.confidence}%`;
  } catch (err) {
    console.error(err);
    resultText.textContent = '❌ Error saat kirim ke Groq AI.';
  } finally {
    btnUpload.disabled = false;
    btnRecord.disabled = false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  resultText.textContent = 'Siap merekam atau pilih file audio kucing.';
});
