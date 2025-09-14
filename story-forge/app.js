const API_BASE = "https://story-forge-ai-sage.vercel.app";

const el = id => document.getElementById(id);
const out = el('out');          // should be a <textarea id="out">
const btn = el('forge');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  out.value = "Forging…";

  const body = {
    hero: el('hero').value.trim(),
    sidekick: el('sidekick').value.trim(),
    setting: el('setting').value.trim(),
    goal: el('goal').value.trim(),
    length: el('length').value
  };

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(`${API_BASE}/api/story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    const text = await res.text(); // read body even if not OK

    if (!res.ok) {
      // Surface server message (first 400 chars) to the textarea
      out.value = `Error forging story (HTTP ${res.status}).\n\n` +
                  (text ? text.slice(0, 400) : '(no response body)');
      console.error('Forge error:', res.status, text);
      return;
    }

    const data = (() => { try { return JSON.parse(text); } catch { return {}; } })();
    out.value = data.story || "No story returned — try again.";
  } catch (e) {
    out.value = `Error forging story.\n\n${e?.message || e}`;
    console.error(e);
  } finally {
    clearTimeout(to);
    btn.disabled = false;
  }
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
// 👇 Add this helper function here
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // bold **foo**
    .replace(/\*(.*?)\*/g, '$1')       // italics *foo*
    .replace(/#+\s/g, '')              // headings
    .replace(/[`>~_$begin:math:display$$end:math:display$]/g, '')        // misc symbols
    .replace(/\n{2,}/g, '\n');         // clean extra line breaks
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
