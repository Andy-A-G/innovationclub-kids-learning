const API_BASE = "https://dd1bba5f-125c-4cb1-af43-318d03d8debb-00-22worsd7snwcl.worf.replit.dev";

const el = id => document.getElementById(id);
const out = el('out');          // should be a <textarea id="out">
const btn = el('forge');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  out.value = "Forging…";
  try {
    const body = {
      hero: el('hero').value.trim(),
      sidekick: el('sidekick').value.trim(),
      setting: el('setting').value.trim(),
      goal: el('goal').value.trim(),
      length: el('length').value
    };
    const res = await fetch(`${API_BASE}/api/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    out.value = data.story || "No story returned — try again.";
  } catch (e) {
    out.value = "Error forging story.";
  } finally { btn.disabled = false; }
});

el('copy').addEventListener('click', async () => {
  await navigator.clipboard.writeText(out.value || "");
});

el('save').addEventListener('click', () => {
  const blob = new Blob([out.value || ""], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'story.txt' });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// --- Text-to-Speech for the story (OUTSIDE of the save handler) ---
function preferredVoice(){
  const vs = window.speechSynthesis.getVoices();
  return vs.find(v=>/Google UK English Female/i.test(v.name)) ||
         vs.find(v=>/en-GB/i.test(v.lang) && /female/i.test(v.name||'')) ||
         vs.find(v=>/en-GB/i.test(v.lang)) || vs[0];
}

function speakStory(text){
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); // start fresh

  const parts = text.trim()
    .split(/\n{2,}|(?<=\.)\s+/) // split by paragraph or sentence end
    .map(s => s.trim())
    .filter(Boolean);

  let i = 0;
  const next = () => {
    if (i >= parts.length) return;
    const u = new SpeechSynthesisUtterance(parts[i++]);
    const v = preferredVoice();
    if (v) u.voice = v;
    u.lang = (v && v.lang) || 'en-GB';
    u.rate = 1; 
    u.pitch = 1;
    u.onend = () => setTimeout(next, 60);
    speechSynthesis.speak(u);
  };
  next();
}

// Buttons
const speakBtn = el('speak');
const stopSpeakBtn = el('stopSpeak');

// Warm voices on Chrome
speechSynthesis.onvoiceschanged = () => { /* triggers voices load */ };

speakBtn?.addEventListener('click', ()=>{
  const txt = out.value?.trim();
  if (!txt || /Your story will appear here/i.test(txt)) return;
  speakStory(txt);
});

stopSpeakBtn?.addEventListener('click', ()=>{
  if ('speechSynthesis' in window) speechSynthesis.cancel();
});
