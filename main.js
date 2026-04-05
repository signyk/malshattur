const SITE_URL = 'https://malshattur.is';

const WIKI_API =
  'https://is.wikipedia.org/w/api.php?' +
  new URLSearchParams({
    action: 'parse',
    page: 'Listi yfir íslenska málshætti',
    prop: 'text',
    format: 'json',
    origin: '*',
  });

let proverbs = [];
let lastIndex = -1;

async function loadProverbs() {
  const res = await fetch(WIKI_API);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const html = json?.parse?.text?.['*'];
  if (!html) throw new Error('Unexpected API response shape');

  const doc = new DOMParser().parseFromString(html, 'text/html');

  // The page is structured as <ul><li>proverb</li>...</ul> sections.
  // Grab all <li> text nodes, strip footnote markers and trim.
  const items = [...doc.querySelectorAll('li')]
    .map((li) => {
      // Remove any <sup> (footnote) nodes before reading text
      li.querySelectorAll('sup, .reference').forEach((el) => el.remove());
      return li.textContent.trim();
    })
    .filter((t) => t.length > 4 && !t.startsWith('↑'));

  if (items.length === 0) throw new Error('No proverbs found in parsed HTML');
  return items;
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
}

async function share(proverb) {
  const text = `🐣 Ég fékk málsháttinn: „${proverb}" — ${SITE_URL}`;
  const shareBtn = document.getElementById('share-btn');

  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
    return;
  }

  // Clipboard fallback
  await navigator.clipboard.writeText(text);
  shareBtn.classList.add('copied');
  setStatus('Afritað!');
  setTimeout(() => {
    shareBtn.classList.remove('copied');
    setStatus('');
  }, 2000);
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
