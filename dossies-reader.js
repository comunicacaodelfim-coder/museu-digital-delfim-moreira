(() => {
  'use strict';
  const configElement = document.getElementById('dossier-pdf-source');
  if (!configElement) return;
  const config = JSON.parse(configElement.textContent);
  const stage = document.getElementById('dossier-pdf-stage');
  const status = document.getElementById('dossier-pdf-status');
  const progress = document.getElementById('dossier-pdf-progress');
  const retry = document.getElementById('dossier-pdf-retry');
  const links = [...document.querySelectorAll('[data-complete-pdf]')];
  let running = false;

  async function loadDocument() {
    if (running) return;
    running = true;
    retry.hidden = true;
    progress.hidden = false;
    progress.value = 0;
    status.textContent = 'Carregando o PDF completo…';
    let loaded = 0;
    const controller = new AbortController();
    try {
      const buffers = await Promise.all(config.parts.map(async part => {
        const response = await fetch(part.url, {signal: controller.signal});
        if (!response.ok) throw new Error('PDF unavailable');
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength !== part.bytes) throw new Error('Incomplete PDF');
        loaded += bytes.byteLength;
        const percent = Math.round(loaded / config.bytes * 100);
        if (!controller.signal.aborted) {
          progress.value = percent;
          status.textContent = `Carregando o PDF completo… ${percent}%`;
        }
        return bytes;
      }));
      const header = new Uint8Array(buffers[0], 0, 5);
      if (String.fromCharCode(...header) !== '%PDF-') throw new Error('Invalid PDF');
      const pdf = new Blob(buffers, {type: 'application/pdf'});
      if (pdf.size !== config.bytes) throw new Error('Incomplete PDF');
      const url = URL.createObjectURL(pdf);
      links.forEach(link => {
        link.href = url;
        link.removeAttribute('aria-disabled');
        link.removeAttribute('tabindex');
        if (link.hasAttribute('download')) link.download = config.filename;
      });
      const viewer = document.createElement('object');
      viewer.className = 'dossier-pdf';
      viewer.type = 'application/pdf';
      viewer.data = url + '#view=FitH';
      viewer.setAttribute('aria-label', `PDF completo: ${config.title}, ${config.pages} páginas`);
      const fallback = document.createElement('div');
      fallback.className = 'dossier-pdf-fallback';
      const text = document.createElement('p');
      text.textContent = 'Abra o documento para ler todas as páginas.';
      const open = document.createElement('a');
      open.className = 'button';
      open.href = url;
      open.target = '_blank';
      open.rel = 'noopener';
      open.textContent = 'Abrir PDF completo';
      fallback.append(text, open);
      viewer.append(fallback);
      stage.replaceChildren(viewer);
      progress.hidden = true;
      status.textContent = `PDF completo disponível: ${config.pages} páginas.`;
    } catch {
      controller.abort();
      progress.hidden = true;
      status.textContent = 'Não foi possível carregar o documento. Verifique sua conexão e tente novamente.';
      retry.hidden = false;
    } finally {
      running = false;
    }
  }

  retry.addEventListener('click', loadDocument);
  loadDocument();
})();
