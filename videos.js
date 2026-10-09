(() => {
  const posters = new WeakMap();
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-youtube-video]');
    if (!button) return;
    const player = button.closest('.video-shell');
    if (!player) return;

    document.querySelectorAll('.video-shell.loaded').forEach(activePlayer => {
      if (posters.has(activePlayer)) {
        activePlayer.innerHTML = posters.get(activePlayer);
        activePlayer.classList.remove('loaded');
      }
    });
    posters.set(player, player.innerHTML);

    const url = new URL('https://www.youtube-nocookie.com/embed/' + button.dataset.youtubeVideo);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('rel', '0');
    if (button.dataset.youtubePlaylist) url.searchParams.set('list', button.dataset.youtubePlaylist);

    const frame = document.createElement('iframe');
    frame.title = button.dataset.youtubeTitle;
    frame.src = url.href;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('allowfullscreen', '');
    player.classList.add('loaded');
    player.replaceChildren(frame);
    frame.focus();
  });
})();
