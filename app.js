/**
 * app.js — logica dell'app Allenamenti.
 * Dipende da db.js (oggetto globale Storage) caricato prima di questo file.
 */

let allenamenti = [];
let completamenti = {};
let indiceCorrente = 0;
let tabAttiva = 'allenamenti';

const el = {
  main: document.getElementById('main-content'),
  dots: document.getElementById('progress-dots'),
  title: document.getElementById('header-title'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  tabButtons: document.querySelectorAll('.tab-btn')
};

async function init() {
  await Storage.init();

  // Seed iniziale: se non ci sono ancora allenamenti salvati, carica quelli di base.
  const count = await Storage.countAllenamenti();
  if (count === 0) {
    try {
      const res = await fetch('seed-data.json');
      const data = await res.json();
      await Storage.saveAllenamentiBulk(data.allenamenti);
    } catch (e) {
      console.error('Impossibile caricare seed-data.json', e);
    }
  }

  await ricaricaDati();
  attachEventListeners();
  render();
}

async function ricaricaDati() {
  allenamenti = await Storage.getAllAllenamenti();
  completamenti = await Storage.getAllCompletamenti();
  if (indiceCorrente >= allenamenti.length) indiceCorrente = Math.max(0, allenamenti.length - 1);
}

function attachEventListeners() {
  el.btnPrev.addEventListener('click', () => {
    if (indiceCorrente > 0) { indiceCorrente--; render(); }
  });
  el.btnNext.addEventListener('click', () => {
    if (indiceCorrente < allenamenti.length - 1) { indiceCorrente++; render(); }
  });

  el.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabAttiva = btn.dataset.tab;
      el.tabButtons.forEach(b => b.classList.toggle('attivo', b === btn));
      render();
    });
  });

  // swipe orizzontale semplice
  let touchStartX = null;
  el.main.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  el.main.addEventListener('touchend', (e) => {
    if (touchStartX === null || tabAttiva !== 'allenamenti') return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0 && indiceCorrente < allenamenti.length - 1) { indiceCorrente++; render(); }
      if (dx > 0 && indiceCorrente > 0) { indiceCorrente--; render(); }
    }
    touchStartX = null;
  }, { passive: true });
}

function render() {
  if (tabAttiva === 'allenamenti') {
    renderHeaderAllenamenti();
    renderDots();
    renderScheda();
  } else {
    renderHeaderImport();
    el.dots.innerHTML = '';
    renderImportView();
  }
}

function renderHeaderAllenamenti() {
  el.btnPrev.classList.remove('hidden');
  el.btnNext.classList.remove('hidden');
  el.btnPrev.disabled = indiceCorrente === 0;
  el.btnNext.disabled = indiceCorrente >= allenamenti.length - 1;
  const a = allenamenti[indiceCorrente];
  el.title.textContent = a ? `${a.n}. ${a.titolo}` : 'Allenamenti';
}

function renderHeaderImport() {
  el.btnPrev.classList.add('hidden');
  el.btnNext.classList.add('hidden');
  el.title.textContent = 'Importa allenamenti';
}

function renderDots() {
  el.dots.innerHTML = allenamenti.map((a, i) => {
    const fatto = completamenti[a.id] && completamenti[a.id].completato;
    const classi = ['dot'];
    if (i === indiceCorrente) classi.push('attivo');
    if (fatto) classi.push('fatto');
    return `<div class="${classi.join(' ')}" data-idx="${i}">${a.n}</div>`;
  }).join('');

  el.dots.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
      indiceCorrente = parseInt(dot.dataset.idx, 10);
      render();
    });
  });
}

function renderScheda() {
  const a = allenamenti[indiceCorrente];
  if (!a) {
    el.main.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px 0;">Nessun allenamento. Vai su "Importa" per aggiungerne.</p>';
    return;
  }

  const comp = completamenti[a.id] || { completato: false, data: null };
  const tipoLabel = a.tipo === 'nuoto' ? '🏊 Nuoto' : '🏠 Casa';

  const sezioniHtml = a.sezioni.map(s => `
    <div class="sezione">
      <div class="sezione-titolo">${escapeHtml(s.titolo)}</div>
      <ul class="blocco">
        ${s.righe.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const totaleHtml = a.totale ? `
    <div class="totale-box ${a.tipo === 'casa' ? 'verde' : ''}">${escapeHtml(a.totale)}</div>
  ` : '';

  const dataStr = comp.data ? new Date(comp.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  el.main.innerHTML = `
    <div class="scheda ${a.tipo}">
      <div class="scheda-header">
        <div class="badge-num">${a.n}</div>
        <div class="scheda-info">
          <h2>${escapeHtml(a.titolo)}</h2>
          <div class="meta">
            <span class="tag ${a.tipo}">${tipoLabel}</span>
            <span>${escapeHtml(a.durata || '')}</span>
            ${a.volume && a.volume !== '—' ? `<span>📏 ${escapeHtml(a.volume)}</span>` : ''}
            ${a.fase ? `<span>${escapeHtml(a.fase)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="scheda-body">
        ${sezioniHtml}
        ${totaleHtml}
        <button class="completa-btn ${comp.completato ? 'completato' : ''}" id="btn-completa">
          ${comp.completato ? `✓ Completato${dataStr ? `<span class="data-completamento">${dataStr}</span>` : ''}` : 'Segna come completato'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-completa').addEventListener('click', async () => {
    const nuovoStato = !(completamenti[a.id] && completamenti[a.id].completato);
    const record = await Storage.setCompletato(a.id, nuovoStato);
    completamenti[a.id] = record;
    render();
  });
}

function renderImportView() {
  el.main.innerHTML = `
    <div class="import-view">
      <h2>Importa nuovi allenamenti</h2>
      <p>Incolla qui il blocco JSON generato in chat, oppure carica un file .json. Lo schema è documentato in SCHEMA.md.</p>
      <textarea id="import-textarea" placeholder='{"allenamenti": [...]}'></textarea>
      <input type="file" id="import-file" accept="application/json,.json">
      <button class="btn-primario" id="btn-importa">Importa</button>
      <div id="import-esito"></div>
    </div>
  `;

  const textarea = document.getElementById('import-textarea');
  const fileInput = document.getElementById('import-file');
  const esitoDiv = document.getElementById('import-esito');

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const text = await file.text();
    textarea.value = text;
  });

  document.getElementById('btn-importa').addEventListener('click', async () => {
    esitoDiv.innerHTML = '';
    let parsed;
    try {
      parsed = JSON.parse(textarea.value);
    } catch (e) {
      esitoDiv.innerHTML = `<div class="import-esito errore">JSON non valido: ${escapeHtml(e.message)}</div>`;
      return;
    }

    if (!parsed.allenamenti || !Array.isArray(parsed.allenamenti)) {
      esitoDiv.innerHTML = `<div class="import-esito errore">Formato non riconosciuto: manca l'array "allenamenti".</div>`;
      return;
    }

    const esistenti = new Set(allenamenti.map(a => a.id));
    const nuovi = parsed.allenamenti.filter(a => !esistenti.has(a.id));
    const duplicati = parsed.allenamenti.filter(a => esistenti.has(a.id));

    if (duplicati.length > 0) {
      const proceduta = confirm(
        `${duplicati.length} allenamento/i hanno un id già esistente (${duplicati.map(d => d.id).join(', ')}). ` +
        `Vuoi sovrascriverli? (i completamenti salvati NON vengono toccati)`
      );
      if (!proceduta) {
        if (nuovi.length === 0) {
          esitoDiv.innerHTML = `<div class="import-esito errore">Import annullato.</div>`;
          return;
        }
      } else {
        nuovi.push(...duplicati);
      }
    }

    await Storage.saveAllenamentiBulk(nuovi);
    await ricaricaDati();
    esitoDiv.innerHTML = `<div class="import-esito ok">Importati ${nuovi.length} allenamento/i con successo.</div>`;
    textarea.value = '';
    fileInput.value = '';
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
