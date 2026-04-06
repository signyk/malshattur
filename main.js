const SITE_URL = 'https://malshattur.is';

let proverbs = [];
let lastIndex = -1;

async function loadProverbs() {
  const res = await fetch('data/malshattur.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json.proverbs) || json.proverbs.length === 0)
    throw new Error('No proverbs found in data file');
  return json.proverbs;
}

function pickRandom(list) {
  if (list.length === 1) return 0;
  let idx;
  do {
    idx = Math.floor(Math.random() * list.length);
  } while (idx === lastIndex);
  return idx;
}

function showProverb(text) {
  const el = document.getElementById('proverb-text');
  el.classList.remove('visible');

  // Brief pause lets the fade-out complete before swapping text
  setTimeout(() => {
    el.textContent = text;
    // Force reflow so transition fires
    void el.offsetWidth;
    el.classList.add('visible');
  }, text === '' ? 0 : 200);

  const shareBtn = document.getElementById('share-btn');
  shareBtn.hidden = false;
  shareBtn.dataset.proverb = text;
  // Trigger fade-in (hidden removal lets display kick in first)
  requestAnimationFrame(() => shareBtn.classList.add('visible'));
}

async function share(proverb) {
  const shareBtn = document.getElementById('share-btn');
  const label = document.getElementById('share-label');

  if (navigator.share) {
    try {
      await navigator.share({
        text: `🐣 Ég fékk málsháttinn: \n„${proverb}"\n\nmalshattur.is`,
      });
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
    return;
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(`🐣 Ég fékk málsháttinn: \n„${proverb}"\n\nmalshattur.is`);
    shareBtn.classList.add('copied');
    label.textContent = 'Afritað!';
    setTimeout(() => {
      shareBtn.classList.remove('copied');
      label.textContent = 'Deila';
    }, 2000);
  } catch (e) {
    console.error('Clipboard failed:', e);
  }
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

function setButtonDisabled(disabled) {
  document.getElementById('btn').disabled = disabled;
}

async function init() {
  const btn = document.getElementById('btn');
  setButtonDisabled(true);
  setStatus('Hleður málsháttum…');

  try {
    proverbs = await loadProverbs();
    setStatus('');
    setButtonDisabled(false);
  } catch (err) {
    console.error(err);
    setStatus('Gat ekki sótt málshætti. Reyndu aftur.');
    setButtonDisabled(false);
  }

  btn.addEventListener('click', () => {
    if (proverbs.length === 0) return;
    const idx = pickRandom(proverbs);
    lastIndex = idx;
    showProverb(proverbs[idx]);
  });

  document.getElementById('share-btn').addEventListener('click', (e) => {
    const proverb = e.currentTarget.dataset.proverb;
    if (proverb) share(proverb);
  });
}

init();
