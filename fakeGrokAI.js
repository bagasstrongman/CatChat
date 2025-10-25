// fakeGrokAI.js
// Fungsi ini mensimulasikan pemanggilan AI.
// Input: audioBlob (Blob)
// Output: Promise<{text: string, confidence: number}>

export async function analyzeCatMeow(audioBlob) {
  // Kita bisa membaca durasi atau ukuran blob sebagai "fitur" sederhana
  const sizeKB = Math.round((audioBlob.size / 1024));
  // Baca sebagian biner untuk "acak"
  const arrayBuffer = await audioBlob.arrayBuffer();
  const view = new Uint8Array(arrayBuffer.slice(0, Math.min(1024, arrayBuffer.byteLength)));
  let sum = 0;
  for (let i = 0; i < view.length; i += 13) sum += view[i];

  // buat skor sederhana
  const score = (sum % 100) / 100;
  const d = sizeKB;

  // Daftar label simulasi
  const labels = [
    {text: "Aku lapar! 🍣", weight: 0.2},
    {text: "Aku ingin bermain! 🧶", weight: 0.18},
    {text: "Aku kesakitan / tidak nyaman. 🚨", weight: 0.12},
    {text: "Aku ingin perhatianmu. 💕", weight: 0.2},
    {text: "Aku bosan. 😿", weight: 0.08},
    {text: "Aku kewaspadaan / takut. 😾", weight: 0.12},
    {text: "Aku rileks dan mendengkur. 😺", weight: 0.1}
  ];

  // Tentukan index dengan kombinasi score + size
  let idx = Math.floor(((score * 0.7) + ((d % 10) / 10) * 0.3) * labels.length);
  idx = Math.max(0, Math.min(labels.length - 1, idx));

  // Berikan variasi acak
  if (Math.random() > 0.85) idx = Math.floor(Math.random() * labels.length);

  const chosen = labels[idx];
  const confidence = Math.round((0.5 + score * 0.5) * 100) / 100; // 0.5 - 1.0

  // Simulasi latency
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

  return {
    text: chosen.text,
    confidence: Math.round(confidence * 100) // persentase
  };
}
