const API_BASE = "https://dd1bba5f-125c-4cb1-af43-318d03d8debb-00-22worsd7snwcl.worf.replit.dev";

const el = id => document.getElementById(id);
const out = el('out');
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
