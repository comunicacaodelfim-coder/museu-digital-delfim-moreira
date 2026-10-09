(() => {
  'use strict';
  const catalog = document.getElementById('catalogo');
  const reader = document.getElementById('leitura');
  const pages = [...document.querySelectorAll('[data-library-page]')];
  const cards = [...document.querySelectorAll('[data-library-open]')];
  const stage = document.querySelector('.library-stage');
  const selector = document.getElementById('library-page-select');
  const previous = document.getElementById('library-previous');
  const next = document.getElementById('library-next');
  const zoomOut = document.getElementById('library-zoom-out');
  const zoomIn = document.getElementById('library-zoom-in');
  const zoomValue = document.getElementById('library-zoom-value');
  const fullscreen = document.getElementById('library-fullscreen');
  const status = document.getElementById('library-reader-status');
  const search = document.getElementById('library-search');
  const count = document.getElementById('library-count');
  let current = -1;
  let zoom = 100;
  let returnFocus = null;

  function applyZoom(value) {
    zoom = Math.min(400, Math.max(100, value));
    if (current >= 0) pages[current].querySelector('.library-sheet').style.width = `${zoom}%`;
    zoomValue.value = `${zoom}%`;
    zoomValue.textContent = `${zoom}%`;
    zoomOut.disabled = zoom === 100;
    zoomIn.disabled = zoom === 400;
  }

  function openPage(index, scroll = true) {
    if (index < 0 || index >= pages.length) return;
    current = index;
    reader.hidden = false;
    pages.forEach((page, i) => { page.hidden = i !== index; });
    document.getElementById('library-reader-title').textContent = pages[index].dataset.title;
    document.getElementById('library-reader-counter').textContent = `APRESENTAÇÃO ${String(index + 1).padStart(2, '0')} DE ${pages.length}`;
    selector.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    const image = pages[index].querySelector('img');
    image.loading = 'eager';
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
    applyZoom(100);
    status.textContent = '';
    if (scroll) reader.scrollIntoView({block: 'start', behavior: 'auto'});
    const heading = document.getElementById('library-reader-title');
    heading.focus({preventScroll: true});
    document.title = `${pages[index].dataset.title} | Biblioteca Virtual | Museu Digital de Delfim Moreira`;
  }

  function navigateTo(index) {
    if (index < 0 || index >= pages.length) return;
    const hash = `#${pages[index].id}`;
    if (location.hash === hash) openPage(index);
    else location.hash = hash;
  }

  function route(scroll = true) {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index >= 0) openPage(index, scroll);
    else {
      const wasOpen = !reader.hidden;
      reader.hidden = true;
      current = -1;
      document.title = 'Biblioteca Virtual | Museu Digital de Delfim Moreira';
      if (document.fullscreenElement === reader && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (wasOpen && scroll) {
        catalog.scrollIntoView({block: 'start', behavior: 'auto'});
        if (returnFocus && !returnFocus.hidden) returnFocus.focus({preventScroll: true});
      }
    }
  }

  function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  }

  function filterCards() {
    const term = normalize(search.value);
    let matches = 0;
    cards.forEach(card => {
      const visible = normalize(card.dataset.librarySearch).includes(term);
      card.hidden = !visible;
      if (visible) matches++;
    });
    count.textContent = `${matches} ${matches === 1 ? 'apresentação' : 'apresentações'}`;
    document.getElementById('library-empty').hidden = matches > 0;
  }

  document.documentElement.classList.add('library-enhanced');
  reader.hidden = true;
  document.querySelectorAll('[data-library-controls]').forEach(control => { control.hidden = false; });
  cards.forEach(card => card.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    returnFocus = card;
    navigateTo(Number(card.dataset.libraryOpen));
  }));
  previous.addEventListener('click', () => navigateTo(current - 1));
  next.addEventListener('click', () => navigateTo(current + 1));
  selector.addEventListener('change', () => navigateTo(Number(selector.value)));
  zoomOut.addEventListener('click', () => applyZoom(zoom - 25));
  zoomIn.addEventListener('click', () => applyZoom(zoom + 25));
  document.getElementById('library-fit').addEventListener('click', () => {
    applyZoom(100);
    stage.scrollLeft = 0;
  });
  search.addEventListener('input', filterCards);
  window.addEventListener('hashchange', () => route());

  if (reader.requestFullscreen) {
    fullscreen.hidden = false;
    fullscreen.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement === reader) await document.exitFullscreen();
        else await reader.requestFullscreen();
      } catch {
        status.textContent = 'A tela cheia não está disponível neste navegador. Use os controles de ampliação para ler.';
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreen.textContent = document.fullscreenElement === reader ? 'Sair da tela cheia' : 'Tela cheia';
    });
  }
  route(Boolean(location.hash));
})();
